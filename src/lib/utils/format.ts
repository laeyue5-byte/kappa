/**
 * Format a number as Philippine Peso currency
 */
export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(num);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    }).format(d);
}

/**
 * Calculate interest (10% of loan amount)
 */
export function calculateInterest(hulam: number | string, rate: number = 0.10): number {
    const amount = typeof hulam === 'string' ? parseFloat(hulam) : hulam;
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Parse CSV string into array of objects
 */
export function parseCSV<T extends Record<string, string>>(csvString: string): T[] {
    const lines = csvString.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj as T;
    });
}

/**
 * Generate initials from a name
 */
export function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
