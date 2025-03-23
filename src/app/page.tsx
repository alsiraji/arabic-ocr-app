"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Tesseract from "tesseract.js";

export default function Page() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState<boolean>(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Clear previous errors
    setProcessed(false); // Reset processed state
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setImage(URL.createObjectURL(file));
    setFile(file);
  };

  const processImage = async (file: File) => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const { data: { text } } = await Tesseract.recognize(file, "ara", {
        logger: (m) => console.log(m),
      });
      setText(text);
      await translateText(text);
      setProcessed(true); // Set processed state to true
    } catch (error) {
      console.error("OCR Error:", error);
      setError("Failed to process the image. Please try again.");
    }
    setLoading(false);
  };

  const translateText = async (arabicText: string) => {
    try {
      const response = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(arabicText) + "&langpair=ar|en");
      const data = await response.json();
      setTranslatedText(data.responseData.translatedText);
    } catch (error) {
      console.error("Translation Error:", error);
      setError("Failed to translate the text. Please try again.");
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <motion.h1
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Arabic Handwriting Detection & Translation
      </motion.h1>
      <Card className="w-full max-w-md p-6 shadow-lg bg-white rounded-2xl">
        <CardContent className="flex flex-col items-center">
          {image ? (
            <Image src={image} alt="Uploaded preview" width={300} height={200} className="rounded-lg" />
          ) : (
            <label className="cursor-pointer flex flex-col items-center p-6 border-2 border-dashed rounded-xl">
              <UploadCloud className="w-10 h-10 text-gray-400" />
              <span className="text-gray-600 mt-2">Upload an Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
          {loading ? (
            <p className="mt-4 text-gray-600">Processing image...</p>
          ) : processed ? (
            <div className="mt-4 w-full flex justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          ) : (
            <Button className="mt-4 w-full" onClick={() => file && processImage(file)}>
              Process Image
            </Button>
          )}
          {text && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full text-center">
              <p className="text-gray-700">Detected Text: {text}</p>
            </div>
          )}
          {translatedText && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full text-center">
              <p className="text-gray-700">Translated Text: {translatedText}</p>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg w-full text-center">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          <Button className="mt-4 w-full" onClick={reloadPage}>
            Reload
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}