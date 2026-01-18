'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importMembersFromCSV } from '@/lib/actions';
import { parseCSV } from '@/lib/utils/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Upload, FileText, Check } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/back-button';

interface CSVRow extends Record<string, string> {
    first_name: string;
    last_name: string;
}

export default function ImportMembersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<CSVRow[]>([]);
    const [fileName, setFileName] = useState('');

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        try {
            const text = await file.text();
            const data = parseCSV<CSVRow>(text);

            if (!data.length) {
                toast.error('No data found in the CSV file.');
                return;
            }

            // Validate required columns
            const firstRow = data[0];
            if (!('first_name' in firstRow) || !('last_name' in firstRow)) {
                toast.error('CSV must have "first_name" and "last_name" columns.');
                return;
            }

            setPreview(data);
            toast.success(`Found ${data.length} members to import.`);
        } catch (error) {
            toast.error('Failed to parse CSV file.');
            console.error(error);
        }
    }

    async function handleImport() {
        if (!preview.length) {
            toast.error('No data to import.');
            return;
        }

        setLoading(true);
        try {
            const result = await importMembersFromCSV(preview);
            toast.success(`Successfully imported ${result.length} members!`);
            router.push('/members');
        } catch (error) {
            toast.error('Failed to import members. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <BackButton fallbackHref="/members" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Import Members</h1>
                    <p className="text-muted-foreground">
                        Import members from a CSV file.
                    </p>
                </div>
            </div>

            {/* Upload Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload CSV File</CardTitle>
                    <CardDescription>
                        Your CSV file should have columns: <code className="bg-muted px-1 rounded">first_name</code> and <code className="bg-muted px-1 rounded">last_name</code>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-4 bg-muted rounded-full">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="font-medium">Click to upload CSV file</p>
                                <p className="text-sm text-muted-foreground">
                                    Maximum file size: 5MB
                                </p>
                            </div>
                        </label>
                    </div>

                    {fileName && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="font-medium">{fileName}</span>
                            <Check className="h-5 w-5 text-green-500 ml-auto" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preview */}
            {preview.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Preview ({preview.length} members)</CardTitle>
                        <CardDescription>
                            Review the data before importing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-80 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Last Name</TableHead>
                                        <TableHead>First Name</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {preview.slice(0, 20).map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{row.last_name}</TableCell>
                                            <TableCell>{row.first_name}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {preview.length > 20 && (
                            <p className="text-sm text-muted-foreground mt-4 text-center">
                                Showing 20 of {preview.length} members...
                            </p>
                        )}

                        <div className="flex gap-4 pt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setPreview([]);
                                    setFileName('');
                                }}
                            >
                                Clear
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleImport}
                                disabled={loading}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {loading ? 'Importing...' : `Import ${preview.length} Members`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
