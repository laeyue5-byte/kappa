'use client';

import { useRouter } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Period {
    id: number;
    name: string;
}

interface Props {
    periods: Period[];
    selectedPeriodId?: number;
}

export function LedgerPeriodSelector({ periods, selectedPeriodId }: Props) {
    const router = useRouter();

    function handlePeriodChange(value: string) {
        router.push(`/ledger?period=${value}`);
    }

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Period:</span>
            <Select
                value={selectedPeriodId?.toString()}
                onValueChange={handlePeriodChange}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
