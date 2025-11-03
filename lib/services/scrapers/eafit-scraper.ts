// File: `lib/services/scrapers/eafit-scraper.ts`
import { parse } from 'node-html-parser';

export interface ScrapedProfessor {
    externalId: string;
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

export class EAFITScraper {
    private baseUrl = 'https://www.eafit.edu.co';
    private professorsListUrl = 'https://www.eafit.edu.co/nuestros-profesores';

    private async fetchHtml(url: string): Promise<string> {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ShifuBot/1.0; +https://shifu.app)',
            },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        return await response.text();
    }

    // ---------- Helpers de imagen ----------
    private toAbs(url: string): string {
        if (!url) return url;
        if (url.startsWith('http')) return url;
        if (url.startsWith('//')) return `https:${url}`;
        return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    private fileNameFromUrl(u: string): string {
        try {
            const url = new URL(u);
            const pathname = url.pathname || '';
            const parts = pathname.split('/').filter(Boolean);
            return parts[parts.length - 1] || '';
        } catch {
            const q = u.split('?')[0];
            const parts = q.split('/').filter(Boolean);
            return parts[parts.length - 1] || '';
        }
    }

    private firstLastTokens(name?: string): string[] {
        if (!name) return [];
        const parts = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .split(/\s+/)
            .filter(Boolean);
        if (parts.length === 0) return [];
        const first = parts[0];
        const last = parts[parts.length - 1];
        return Array.from(new Set([first, last])).filter(Boolean);
    }

    private bannedImage(url: string): boolean {
        const u = url.toLowerCase();
        if (u.endsWith('.svg')) return true;
        // logos y placeholders comunes
        if (/logo|isotipo|imagotipo|brand|placeholder|default/.test(u)) return true;
        return false;
    }

    private scoreImage(url: string, name?: string): number {
        const u = this.toAbs(url);
        const lower = u.toLowerCase();
        const fn = this.fileNameFromUrl(lower);

        // Base: penalizar si parece logo/placeholder
        if (this.bannedImage(lower)) return -100;

        // Bonos por dominio/patrón típico de retratos
        let score = 0;
        if (/widen\.net\/content\//.test(lower)) score += 8; // retratos de CMS
        if (/\/web\//.test(lower)) score += 3;

        // Preferir formatos fotográficos
        if (/\.(jpg|jpeg|png|webp)(\?|$)/.test(lower)) score += 2;

        // Si tiene dimensiones en query (w/h) y son razonables, sumar
        try {
            const q = new URL(u).searchParams;
            const w = parseInt(q.get('w') || '0', 10);
            const h = parseInt(q.get('h') || '0', 10);
            if (w >= 250) score += 2;
            if (h >= 250) score += 2;
        } catch {
            // ignore
        }

        // Coincidencia con el nombre (fichero que contenga parte del nombre)
        const tokens = this.firstLastTokens(name);
        let tokenHits = 0;
        for (const t of tokens) {
            if (fn.includes(t)) tokenHits++;
        }
        if (tokenHits >= 2) score += 6;
        else if (tokenHits === 1) score += 3;

        // Pequeño bonus si no es share-link corto de Widen (/s/), que suele ser para logos/brand
        if (/widen\.net\/s\//.test(lower)) score -= 4;

        return score;
    }

    private pickBestImage(candidates: string[], name?: string): string | undefined {
        const scored = candidates
            .filter(Boolean)
            .map((c) => ({ url: this.toAbs(c), s: this.scoreImage(c, name) }))
            .sort((a, b) => b.s - a.s);
        const best = scored[0];
        if (!best) return undefined;
        // Umbral mínimo para aceptar
        if (best.s < 1) return undefined;
        return best.url;
    }

    private collectImageCandidatesFromDom(root: any, name?: string): string[] {
        const urls: string[] = [];

        // Meta tags
        const og = root.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        const tw = root.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '';
        if (og) urls.push(og);
        if (tw) urls.push(tw);

        // Selectores frecuentes
        const sels = [
            '.hero img',
            '.banner img',
            '.profile img',
            '.perfil img',
            'header img',
            'main img',
            'img[alt*="foto" i]',
            'img[alt*="perfil" i]',
            'img[alt*="portrait" i]',
        ];
        for (const sel of sels) {
            const imgs = root.querySelectorAll(sel) || [];
            for (const img of imgs) {
                const src = img?.getAttribute?.('src') || '';
                if (src) urls.push(src);
            }
        }

        // Filtro básico deduplicado
        const seen = new Set<string>();
        const dedup = urls
            .map((u) => this.toAbs(u))
            .filter((u) => {
                if (!u) return false;
                if (seen.has(u)) return false;
                seen.add(u);
                return true;
            });

        return dedup;
    }

    // ---------- Scraping lista ----------
    private async scrapeProfessorListByUrl(
        url: string,
    ): Promise<{ professors: Array<{ name: string; url: string; image?: string }>; nextUrl?: string }> {
        const html = await this.fetchHtml(url);
        const root = parse(html);
        const professors: Array<{ name: string; url: string; image?: string }> = [];

        const anchors = root.querySelectorAll('a');
        for (const a of anchors) {
            const text = a.text.trim().toLowerCase();
            const href = a.getAttribute('href') || '';
            const looksLikeProfile = href.includes('/nuestros-profesores/');
            if (text.includes('ver perfil') && looksLikeProfile) {
                let name = '';
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
                        // intentar capturar imagen cercana y validarla
                        let card: any = a.parentNode;
                        let imageUrl: string | undefined;
                        const nearby: string[] = [];
                        for (let j = 0; j < 5 && card; j++) {
                            const imgEl = card.querySelector?.('img');
                            const src = imgEl?.getAttribute('src') || '';
                            if (src) nearby.push(src);
                            card = card.parentNode;
                        }
                        const best = this.pickBestImage(nearby, name);
                        if (best) imageUrl = best;
                        professors.push({ name: name || fullUrl, url: fullUrl, image: imageUrl });
                    }
                }
            }
        }

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
                    let imageUrl: string | undefined;
                    let card: any = h.parentNode;
                    const nearby: string[] = [];
                    for (let j = 0; j < 5 && card; j++) {
                        const imgEl = card.querySelector?.('img');
                        const src = imgEl?.getAttribute('src') || '';
                        if (src) nearby.push(src);
                        card = card.parentNode;
                    }
                    const best = this.pickBestImage(nearby, name);
                    if (best) imageUrl = best;
                    professors.push({ name, url: fullUrl, image: imageUrl });
                }
            }
        }

        // Siguiente página
        let nextUrl: string | undefined;
        for (const a of anchors) {
            const text = a.text.trim().toLowerCase();
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
        if (!nextUrl && professors.length > 0) {
            const urlObj = new URL(url);
            const currentPage = parseInt(urlObj.searchParams.get('page') || '1', 10);
            const nextPage = currentPage + 1;
            urlObj.searchParams.set('page', nextPage.toString());
            urlObj.searchParams.set('label', '');
            nextUrl = urlObj.toString();
        }

        return { professors, nextUrl };
    }

    // ---------- Bio ----------
    private pickBioFromDom(root: any): string | undefined {
        const candidatesByHeading: string[] = [];
        const headings = root.querySelectorAll('h2, h3, h4, button, a, li');
        for (const h of headings) {
            const txt = (h.text || '').trim().toLowerCase();
            if (/(^|\s)(resumen|summary)(\s|$)/i.test(txt)) {
                let cont: any = h.parentNode;
                for (let i = 0; i < 5 && cont; i++) {
                    const ps = cont.querySelectorAll?.('p') || [];
                    for (const p of ps) {
                        const t = (p.text || '').trim();
                        if (t.length >= 80) candidatesByHeading.push(t);
                    }
                    cont = cont.parentNode;
                }
            }
        }
        if (candidatesByHeading.length) {
            const chosen = this.filterMarketingAndPick(candidatesByHeading);
            if (chosen) return chosen;
        }

        const main = root.querySelector('main') || root;
        const psAll = main.querySelectorAll('p');
        const filtered = psAll
            .map((p: any) => (p.text || '').trim())
            .filter((t: string) => t && t.length >= 80);

        const chosen = this.filterMarketingAndPick(filtered);
        return chosen;
    }

    private filterMarketingAndPick(candidates: string[]): string | undefined {
        const banned = [
            /¿eres estudiante/i,
            /explora las opciones/i,
            /información para ti/i,
            /accesibilidad/i,
            /menú/i,
            /búsqueda/i,
            /universidad eafit/i,
            /síguenos/i,
            /redes sociales/i,
        ];

        const score = (t: string) => {
            if (banned.some((re) => re.test(t))) return -9999;
            let s = 0;
            if (/^soy\s+(profesor|profesora)/i.test(t)) s += 3;
            if (/(docencia|investigación|emprendimiento|proyectos|diseño|innovación)/i.test(t)) s += 2;
            if (t.length >= 120 && t.length <= 1200) s += 2;
            return s;
        };

        let best: { t: string; s: number } | null = null;
        for (const t of candidates) {
            const s = score(t);
            if (!best || s > best.s) best = { t, s };
        }
        return best && best.s > -9999 ? best.t : undefined;
    }

    // ---------- Detalle de profesor ----------
    private async scrapeProfessorDetail(url: string, fallbackImage?: string): Promise<ScrapedProfessor> {
        const html = await this.fetchHtml(url);
        const root = parse(html);

        let nombreCompleto = root.querySelector('h1')?.text.trim() || '';
        if (!nombreCompleto) {
            const og = root.querySelector('meta[property="og:title"]');
            nombreCompleto = og?.getAttribute('content')?.trim() || '';
        }

        // Bio
        const bio = this.pickBioFromDom(root);

        // Email
        const emailElement = root.querySelector('a[href^="mailto:"]');
        const email = emailElement ? emailElement.getAttribute('href')?.replace('mailto:', '') : undefined;

        // Escuela/Departamento
        const breadcrumbs = root.querySelectorAll('.breadcrumb li, nav a, nav li, header a');
        let escuela: string | undefined;
        for (const crumb of breadcrumbs) {
            const text = (crumb.text || '').trim();
            if (/Escuela/i.test(text)) {
                escuela = text;
            }
        }

        // Tags
        const areasConocimiento: string[] = [];
        const programas: string[] = [];
        const gruposInvestigacion: string[] = [];
        const tags = root.querySelectorAll('.facet-item, .tag, .badge, .chip, .etiqueta, button, a');
        for (const tag of tags) {
            const text = (tag.text || '').trim();
            if (!text) continue;
            if (/Área de|Investigación|Grupo/i.test(text)) {
                if (/Grupo/i.test(text)) gruposInvestigacion.push(text);
                else areasConocimiento.push(text);
            } else if (/Maestría|Doctorado|Pregrado/i.test(text)) {
                programas.push(text);
            }
        }

        // Imagen: coleccionar candidatos y puntuar
        const candidates = this.collectImageCandidatesFromDom(root, nombreCompleto);
        if (fallbackImage) candidates.push(fallbackImage);
        const fotografia = this.pickBestImage(candidates, nombreCompleto);

        return {
            externalId: url,
            nombreCompleto,
            bio,
            email,
            escuela,
            areasConocimiento: areasConocimiento.length ? areasConocimiento : undefined,
            programas: programas.length ? programas : undefined,
            gruposInvestigacion: gruposInvestigacion.length ? gruposInvestigacion : undefined,
            fotografia,
            rawData: {
                scrapedAt: new Date().toISOString(),
                sourceUrl: url,
                imageCandidates: candidates,
            },
        };
    }

    async scrapeAll(options?: { maxPages?: number }): Promise<ScrapeResult> {
        const professors: ScrapedProfessor[] = [];
        const errors: Array<{ url: string; error: string }> = [];
        const maxPages = options?.maxPages ?? 50;

        const professorList: Array<{ name: string; url: string; image?: string }> = [];
        let currentUrl = `${this.professorsListUrl}?label=&page=1`;
        let pageNum = 1;
        const maxPageNum = Math.min(maxPages, 50);

        while (currentUrl && pageNum <= maxPageNum) {
            try {
                const result = await this.scrapeProfessorListByUrl(currentUrl);
                professorList.push(...result.professors);
                if (result.professors.length === 0) break;
                currentUrl = result.nextUrl || new URL(`${this.professorsListUrl}?label=&page=${pageNum + 1}`).toString();
                pageNum++;
                await new Promise((r) => setTimeout(r, 700));
            } catch (error) {
                errors.push({ url: currentUrl, error: error instanceof Error ? error.message : 'Unknown error' });
                break;
            }
        }

        for (let i = 0; i < professorList.length; i++) {
            const prof = professorList[i];
            try {
                const detail = await this.scrapeProfessorDetail(prof.url, prof.image);
                professors.push(detail);
                await new Promise((r) => setTimeout(r, 1200));
            } catch (error) {
                errors.push({ url: prof.url, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }

        return { professors, totalCount: professors.length, errors, timestamp: new Date() };
    }

    async scrapeOne(url: string): Promise<ScrapedProfessor> {
        return this.scrapeProfessorDetail(url);
    }
}
