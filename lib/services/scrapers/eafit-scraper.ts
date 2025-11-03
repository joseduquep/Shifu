/**
 * EAFIT Professor Web Scraper
 * Scrapes professor data from https://www.eafit.edu.co/nuestros-profesores
 */

import { parse } from 'node-html-parser';

export interface ScrapedProfessor {
	externalId: string; // URL to professor's profile
	nombreCompleto: string;
	bio?: string;
	email?: string;
	departamento?: string;
	escuela?: string;
	areasConocimiento?: string[];
	programas?: string[];
	gruposInvestigacion?: string[];
	fotografia?: string;
	rawData?: Record<string, unknown>;
}

export interface ScrapeResult {
	professors: ScrapedProfessor[];
	totalCount: number;
	errors: Array<{ url: string; error: string }>;
	timestamp: Date;
}

/**
 * Main scraper class for EAFIT professors
 */
export class EAFITScraper {
	private baseUrl = 'https://www.eafit.edu.co';
	private professorsListUrl = 'https://www.eafit.edu.co/nuestros-profesores';

	/**
	 * Fetch HTML content from a URL
	 */
	private async fetchHtml(url: string): Promise<string> {
		try {
			const response = await fetch(url, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (compatible; ShifuBot/1.0; +https://shifu.app)',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.text();
		} catch (error) {
			throw new Error(
				`Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Extract professor cards from the main listing page
	 */
	private async scrapeProfessorListByUrl(
		url: string,
	): Promise<{ professors: Array<{ name: string; url: string; image?: string }>; nextUrl?: string }> {
		const html = await this.fetchHtml(url);
		const root = parse(html);

		const professors: Array<{ name: string; url: string; image?: string }> = [];

		// Strategy 1: buttons/links that say "Ver perfil"
		const anchors = root.querySelectorAll('a');
		for (const a of anchors) {
			const text = a.text.trim().toLowerCase();
			const href = a.getAttribute('href') || '';
			// Only accept professor profile paths
			const looksLikeProfile = href.includes('/nuestros-profesores/');
			if (text.includes('ver perfil') && looksLikeProfile) {
				let name = '';
				// Try to find an h4/h3 near this link (in the same card container)
				let container: any = a.parentNode;
				for (let i = 0; i < 5 && container; i++) {
					const h = container.querySelector?.('h4, h3');
					if (h && h.text?.trim()) {
						name = h.text.trim();
						break;
					}
					container = container.parentNode;
				}

				if (href) {
					const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
					if (name.toLowerCase() !== 'lo más reciente') {
						// intentar obtener imagen de la card (img dentro del mismo bloque)
						let card: any = a.parentNode;
						let imageUrl: string | undefined;
						for (let j = 0; j < 5 && card; j++) {
							const imgEl = card.querySelector?.('img');
							const src = imgEl?.getAttribute('src') || '';
							if (src && !src.endsWith('.svg')) {
								imageUrl = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
								break;
							}
							card = card.parentNode;
						}
						professors.push({ name: name || fullUrl, url: fullUrl, image: imageUrl });
					}
				}
			}
		}

		// Strategy 2: fallback — cards with h4 + first anchor inside same card
		if (professors.length === 0) {
			const headers = root.querySelectorAll('h4, h3');
			for (const h of headers) {
				const name = h.text.trim();
				let link: string | undefined;
				let container: any = h.parentNode;
				for (let i = 0; i < 5 && container && !link; i++) {
					const a = container.querySelector?.('a');
					if (a) {
						const href = a.getAttribute('href') || '';
						if (href.includes('/nuestros-profesores/')) link = href;
					}
					container = container.parentNode;
				}
				if (name && link && name.toLowerCase() !== 'lo más reciente') {
					const fullUrl = link.startsWith('http') ? link : `${this.baseUrl}${link}`;
					// buscar una imagen cercana
					let imageUrl: string | undefined;
					let card: any = h.parentNode;
					for (let j = 0; j < 5 && card; j++) {
						const imgEl = card.querySelector?.('img');
						const src = imgEl?.getAttribute('src') || '';
						if (src && !src.endsWith('.svg')) {
							imageUrl = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
							break;
						}
						card = card.parentNode;
					}
					professors.push({ name, url: fullUrl, image: imageUrl });
				}
			}
		}

		// Find next page link by text content (Siguiente página › / Siguiente)
		let nextUrl: string | undefined;
		for (const a of anchors) {
			const text = a.text.trim().toLowerCase();
			// Buscar "siguiente página" o "siguiente" (con o sin el símbolo ›)
			if (
				text.includes('siguiente página') ||
				text.includes('siguiente') ||
				text.includes('next') ||
				a.getAttribute('rel') === 'next'
			) {
				const href = a.getAttribute('href');
				if (href) {
					nextUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
					break;
				}
			}
		}

		// Si no encontramos el link pero hay profesores, intentar construir la URL de la siguiente página
		if (!nextUrl && professors.length > 0) {
			const urlObj = new URL(url);
			const currentPage = parseInt(urlObj.searchParams.get('page') || '1', 10);
			const nextPage = currentPage + 1;
			urlObj.searchParams.set('page', nextPage.toString());
			urlObj.searchParams.set('label', ''); // Mantener el parámetro label
			nextUrl = urlObj.toString();
		}

		return { professors, nextUrl };
	}

	/**
	 * Scrape detailed information from a professor's profile page
	 */
	private async scrapeProfessorDetail(url: string, fallbackImage?: string): Promise<ScrapedProfessor> {
		const html = await this.fetchHtml(url);
		const root = parse(html);

		// Extract professor name (from h1 or og:title)
		let nombreCompleto = root.querySelector('h1')?.text.trim() || '';
		if (!nombreCompleto) {
			const og = root.querySelector('meta[property="og:title"]');
			nombreCompleto = og?.getAttribute('content')?.trim() || '';
		}

		// Extract bio/description: pick first substantial paragraph
		let bio: string | undefined;
		const paragraphs = root.querySelectorAll(
			'.profesor-bio p, .content p, article p, main p, p',
		);
		for (const p of paragraphs) {
			const t = p.text.trim();
			if (t && t.length > 120) {
				bio = t;
				break;
			}
		}

		// Extract email
		const emailElement = root.querySelector('a[href^="mailto:"]');
		const email = emailElement
			? emailElement.getAttribute('href')?.replace('mailto:', '')
			: undefined;

		// Extract department/school
		const breadcrumbs = root.querySelectorAll('.breadcrumb li, nav a');
		let escuela: string | undefined;
		let departamento: string | undefined;

		for (const crumb of breadcrumbs) {
			const text = crumb.text.trim();
			if (text.includes('Escuela')) {
				escuela = text;
			}
		}

		// Extract research areas, programs, and groups from chips/tags/buttons
		const areasConocimiento: string[] = [];
		const programas: string[] = [];
		const gruposInvestigacion: string[] = [];

		// Look for facets/tags in the page
		const tags = root.querySelectorAll(
			'.facet-item, .tag, .badge, .chip, .etiqueta, button, a',
		);

		for (const tag of tags) {
			const text = tag.text.trim();

			if (
				text.includes('Área de') ||
				text.includes('Investigación') ||
				text.includes('Grupo')
			) {
				if (text.includes('Grupo')) {
					gruposInvestigacion.push(text);
				} else {
					areasConocimiento.push(text);
				}
			} else if (text.includes('Maestría') || text.includes('Doctorado') || text.includes('Pregrado')) {
				programas.push(text);
			}
		}

		// Extract profile image (prioritize og:image, then visible hero/profile images)
		let fotografia: string | undefined;
		// 1) og:image
		const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
		if (ogImage) {
			fotografia = ogImage.startsWith('http') ? ogImage : `${this.baseUrl}${ogImage}`;
		}

		// 3) Usar imagen del listado si no encontramos una en el detalle
		if (!fotografia && fallbackImage) {
			fotografia = fallbackImage;
		}

		// 2) Common hero/profile containers
		if (!fotografia) {
			const imgSelectors = [
				'.hero img',
				'.banner img',
				'.profile img',
				'.perfil img',
				'header img',
				'main img',
				'img[alt*="foto" i]',
				`img[alt*="${nombreCompleto.split(' ')[0] || ''}" i]`,
			];
			for (const sel of imgSelectors) {
				const img = root.querySelector(sel);
				const src = img?.getAttribute('src') || '';
				if (src && !src.endsWith('.svg') && !src.includes('logo_EAFIT')) {
					fotografia = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
					break;
				}
			}
		}

		return {
			externalId: url,
			nombreCompleto,
			bio,
			email,
			escuela,
			departamento,
			areasConocimiento: areasConocimiento.length > 0 ? areasConocimiento : undefined,
			programas: programas.length > 0 ? programas : undefined,
			gruposInvestigacion:
				gruposInvestigacion.length > 0 ? gruposInvestigacion : undefined,
			fotografia,
			rawData: {
				scrapedAt: new Date().toISOString(),
				sourceUrl: url,
			},
		};
	}

	/**
	 * Scrape all professors from EAFIT website
	 */
	async scrapeAll(options?: { maxPages?: number }): Promise<ScrapeResult> {
		const professors: ScrapedProfessor[] = [];
		const errors: Array<{ url: string; error: string }> = [];

		const maxPages = options?.maxPages ?? 50;

		console.log('Starting EAFIT professor scraping...');

		// Step 1: Get list of all professors (follow next links)
		const professorList: Array<{ name: string; url: string; image?: string }> = [];
		// Comenzar con la URL base que incluye page=1
		let currentUrl = `${this.professorsListUrl}?label=&page=1`;
		let pageNum = 1;
		const maxPageNum = 4; // Límite específico: página 4
		
		while (currentUrl && pageNum <= maxPageNum && pageNum <= maxPages) {
			try {
				console.log(`Fetching professor list page ${pageNum}...`);
				const result = await this.scrapeProfessorListByUrl(currentUrl);
				professorList.push(...result.professors);
				
				// Si no hay profesores o no hay siguiente URL, parar
				if (result.professors.length === 0) {
					console.log(`No professors found on page ${pageNum}, stopping.`);
					break;
				}
				
				// Si llegamos a la página 4, parar
				if (pageNum >= maxPageNum) {
					console.log(`Reached page ${maxPageNum}, stopping.`);
					break;
				}
				
				// Si hay siguiente URL, usarla; si no, construir la siguiente página
				if (result.nextUrl) {
					currentUrl = result.nextUrl;
				} else {
					// Construir URL de la siguiente página manualmente
					const urlObj = new URL(currentUrl);
					urlObj.searchParams.set('page', (pageNum + 1).toString());
					currentUrl = urlObj.toString();
				}
				
				pageNum++;

				// Rate limiting: wait between requests
				await new Promise((resolve) => setTimeout(resolve, 1000));
			} catch (error) {
				console.error(`Error fetching list page ${pageNum}:`, error);
				errors.push({
					url: currentUrl,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
				break;
			}
		}

		console.log(`Found ${professorList.length} professors to scrape`);

		// Step 2: Scrape each professor's detail page
		for (let i = 0; i < professorList.length; i++) {
			const prof = professorList[i];

			try {
				console.log(
					`Scraping professor ${i + 1}/${professorList.length}: ${prof.name}`,
				);
				const detail = await this.scrapeProfessorDetail(prof.url, prof.image);
				professors.push(detail);

				// Rate limiting: wait between requests
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} catch (error) {
				console.error(`Error scraping ${prof.name} (${prof.url}):`, error);
				errors.push({
					url: prof.url,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		return {
			professors,
			totalCount: professors.length,
			errors,
			timestamp: new Date(),
		};
	}

	/**
	 * Scrape a single professor by URL
	 */
	async scrapeOne(url: string): Promise<ScrapedProfessor> {
		return this.scrapeProfessorDetail(url);
	}
}

