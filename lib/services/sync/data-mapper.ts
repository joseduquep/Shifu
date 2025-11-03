/**
 * Data Mapper
 * Transforms scraped external data into Shifu database schema
 */

import type { ScrapedProfessor } from '../scrapers/eafit-scraper';

export interface MappedProfessor {
	// Core fields
	nombre_completo: string;
	email?: string;
	bio?: string;
	departamento_id?: string;

	// Scraping metadata
	external_id: string;
	external_source: string;
	raw_scraped_data: Record<string, unknown>;

	// Additional data for processing
	departamento_nombre?: string;
	escuela_nombre?: string;
	universidad_nombre?: string;
}

export interface FieldMapping {
	externalField: string;
	internalField: string;
	transform?: (value: unknown) => unknown;
}

/**
 * Maps scraped data to Shifu's internal schema
 */
export class DataMapper {
	private defaultUniversidad = 'Universidad EAFIT';

	/**
	 * Map a scraped professor to internal schema
	 */
	mapProfessor(scraped: ScrapedProfessor, universidadNombre?: string): MappedProfessor {
		return {
			nombre_completo: this.cleanName(scraped.nombreCompleto),
			email: scraped.email?.toLowerCase(),
			bio: this.cleanBio(scraped.bio),
			external_id: scraped.externalId,
			external_source: 'eafit_web',
			raw_scraped_data: {
				...scraped.rawData,
				areasConocimiento: scraped.areasConocimiento,
				programas: scraped.programas,
				gruposInvestigacion: scraped.gruposInvestigacion,
				fotografia: scraped.fotografia,
				scrapedData: scraped,
			},
			departamento_nombre: scraped.departamento || this.extractDepartmentFromSchool(scraped.escuela),
			escuela_nombre: scraped.escuela,
			universidad_nombre: universidadNombre || this.defaultUniversidad,
		};
	}

	/**
	 * Map multiple professors
	 */
	mapProfessors(scraped: ScrapedProfessor[], universidadNombre?: string): MappedProfessor[] {
		return scraped.map((prof) => this.mapProfessor(prof, universidadNombre));
	}

	/**
	 * Clean up professor name
	 */
	private cleanName(name: string): string {
		return name
			.trim()
			.replace(/\s+/g, ' ')
			.replace(/^(Dr\.|Dra\.|Prof\.|Profa\.)\s*/i, '');
	}

	/**
	 * Clean up bio text
	 */
	private cleanBio(bio?: string): string | undefined {
		if (!bio) return undefined;

		return bio
			.trim()
			.replace(/\s+/g, ' ')
			.replace(/\n{3,}/g, '\n\n')
			.substring(0, 5000); // Limit length
	}

	/**
	 * Extract department name from school name
	 */
	private extractDepartmentFromSchool(escuela?: string): string | undefined {
		if (!escuela) return undefined;

		// Map schools to departments (you can expand this)
		const schoolToDepartment: Record<string, string> = {
			'Escuela de Administración': 'Administración',
			'Escuela de Ciencias Aplicadas e Ingeniería': 'Ingeniería',
			'Escuela de Artes y Humanidades': 'Humanidades',
			'Escuela de Finanzas, Economía y Gobierno': 'Economía',
			'Escuela de Derecho': 'Derecho',
		};

		for (const [school, dept] of Object.entries(schoolToDepartment)) {
			if (escuela.includes(school)) {
				return dept;
			}
		}

		return escuela;
	}

	/**
	 * Validate mapped data
	 */
	validate(mapped: MappedProfessor): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!mapped.nombre_completo || mapped.nombre_completo.length < 2) {
			errors.push('nombre_completo is required and must be at least 2 characters');
		}

		if (mapped.email && !this.isValidEmail(mapped.email)) {
			errors.push('email is not valid');
		}

		if (!mapped.external_id) {
			errors.push('external_id is required');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Simple email validation
	 */
	private isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	/**
	 * Compare two professor records to detect changes
	 */
	detectChanges(
		current: Partial<MappedProfessor>,
		incoming: MappedProfessor,
		manualOverrideFields: string[] = [],
	): {
		hasChanges: boolean;
		changes: Record<string, { old: unknown; new: unknown }>;
		overriddenFields: string[];
	} {
		const changes: Record<string, { old: unknown; new: unknown }> = {};
		const overriddenFields: string[] = [];

		const fieldsToCheck = ['nombre_completo', 'email', 'bio'] as const;

		for (const field of fieldsToCheck) {
			// Skip if field is manually overridden
			if (manualOverrideFields.includes(field)) {
				if (current[field] !== incoming[field]) {
					overriddenFields.push(field);
				}
				continue;
			}

			// Detect change
			if (current[field] !== incoming[field]) {
				changes[field] = {
					old: current[field],
					new: incoming[field],
				};
			}
		}

		return {
			hasChanges: Object.keys(changes).length > 0,
			changes,
			overriddenFields,
		};
	}
}

