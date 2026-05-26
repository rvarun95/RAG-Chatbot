"use client";

import { useState } from "react";
import { processPdfFile } from "./action";
import { Card, CardContent } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function PDFUploadPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error",
        text: string,
    } | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setMessage({
                type: "error",
                text: "Please select a PDF file to upload.",
            });
            return;
        }
        setIsLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("pdf", file);

            const result = await processPdfFile(formData);
            if (result.success) {
                setMessage({
                    type: "success",
                    text: result.message || "PDF file processed successfully.",
                });
                event.target.value = ""; // Clear the file input after successful upload
            } else {
                setMessage({
                    type: "error",
                    text: result.message || "Failed to process PDF file.",
                });
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setMessage({
                type: "error",
                text: "An error occurred while processing the file.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Upload PDF Document</h1>

                <Card className="bg-white shadow-md">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700">Select a PDF file to upload:</Label>
                            <Input 
                                type="file" 
                                id="pdf-file" 
                                accept="application/pdf"
                                onChange={handleFileUpload}
                                disabled={isLoading}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {
                                isLoading && (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                                        <span className="text-sm text-gray-500">Processing PDF...</span>
                                    </div>
                                )
                            }

                            {
                                message && (
                                    <Alert variant={message.type === "success" ? "default" : "destructive"}>
                                        <AlertTitle className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                                            {message.type === "success" ? "Success!" : "Error!"}
                                        </AlertTitle>
                                        <AlertDescription className={message.type === "success" ? "text-green-700" : "text-red-700"}>
                                            {message.text}
                                        </AlertDescription>
                                    </Alert>
                                )
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}