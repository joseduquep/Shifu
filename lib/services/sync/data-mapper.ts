// File: `lib/services/sync/data-mapper.ts`
import type { ScrapedProfessor } from '../scrapers/eafit-scraper';

export interface MappedProfessor {
    nombre_completo: string;
    email?: string;
    bio?: string;
    departamento_id?: string;
    external_id: string;
    external_source: string;
    raw_scraped_data: Record<string, unknown>;
    departamento_nombre?: string;
    escuela_nombre?: string;
    universidad_nombre?: string;
    fotografia?: string; // NUEVO
}

export class DataMapper {
    private defaultUniversidad = 'Universidad EAFIT';

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
            fotografia: scraped.fotografia, // NUEVO
        };
    }

    mapProfessors(scraped: ScrapedProfessor[], universidadNombre?: string): MappedProfessor[] {
        return scraped.map((p) => this.mapProfessor(p, universidadNombre));
    }

    private cleanName(name: string): string {
        return name.trim().replace(/\s+/g, ' ').replace(/^(Dr\.|Dra\.|Prof\.|Profa\.)\s*/i, '');
    }

    private cleanBio(bio?: string): string | undefined {
        if (!bio) return undefined;
        const banned = [
            /¿eres estudiante/i,
            /explora las opciones/i,
            /información para ti/i,
            /accesibilidad/i,
            /búsqueda/i,
            /menú/i,
        ];
        let t = bio.trim();
        t = t
            .split(/\n+/)
            .filter((line) => line.trim() && !banned.some((re) => re.test(line)))
            .join(' ');
        return t.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').substring(0, 5000);
    }

    private extractDepartmentFromSchool(escuela?: string): string | undefined {
        if (!escuela) return undefined;
        const schoolToDepartment: Record<string, string> = {
            'Escuela de Administración': 'Administración',
            'Escuela de Ciencias Aplicadas e Ingeniería': 'Ingeniería',
            'Escuela de Artes y Humanidades': 'Humanidades',
            'Escuela de Finanzas, Economía y Gobierno': 'Economía',
            'Escuela de Derecho': 'Derecho',
        };
        for (const [school, dept] of Object.entries(schoolToDepartment)) {
            if (escuela.includes(school)) return dept;
        }
        return escuela;
    }

    validate(mapped: MappedProfessor): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!mapped.nombre_completo || mapped.nombre_completo.length < 2) {
            errors.push('nombre_completo is required and must be at least 2 characters');
        }
        if (mapped.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.email)) {
            errors.push('email is not valid');
        }
        if (!mapped.external_id) {
            errors.push('external_id is required');
        }
        return { valid: errors.length === 0, errors };
    }
}
