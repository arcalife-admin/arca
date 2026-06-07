'use client'

import React, { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, X, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VideoItem {
  id: string;
  title: string;
  embedUrl: string;
  isCustom: boolean;
  order: number;
}

interface ImageItem {
  id: string;
  title: string;
  imageUrl: string;
  isCustom: boolean;
  order: number;
}

function isDirectVideo(url: string): boolean {
  return !url.includes('youtube.com/embed');
}

export default function InstructionsPage() {
  const [videoSearch, setVideoSearch] = useState("");
  const [imageSearch, setImageSearch] = useState("");
  const [videos, setVideoclipuri] = useState<VideoItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add video modal state
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoSubmitting, setVideoSubmitting] = useState(false);

  // Add image modal state
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [imageTitle, setImageTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageSubmitting, setImageSubmitting] = useState(false);

  // Fetch data from API
  const fetchInstructions = async () => {
    try {
      const response = await fetch('/api/instructions');
      if (!response.ok) {
        throw new Error('Încărcarea instrucțiunilor a eșuat');
      }
      const data = await response.json();
      setVideoclipuri(data.videos);
      setImages(data.images);
    } catch (error) {
      console.error('Error fetching instructions:', error);
      toast({
        title: "Eroare",
        description: "Încărcarea instrucțiunilor a eșuat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, []);

  const filteredVideoclipuri = useMemo(() => {
    if (!videoSearch.trim()) return videos;
    const term = videoSearch.toLowerCase();
    return videos.filter((v) => v.title.toLowerCase().includes(term));
  }, [videoSearch, videos]);

  const filteredImages = useMemo(() => {
    if (!imageSearch.trim()) return images;
    const term = imageSearch.toLowerCase();
    return images.filter((img) => img.title.toLowerCase().includes(term));
  }, [imageSearch, images]);

  // Handle video addition
  const handleAddVideo = async () => {
    if (!videoTitle.trim() || !videoUrl.trim()) {
      toast({
        title: "Eroare",
        description: "Furnizați atât titlul cât și URL-ul YouTube",
        variant: "destructive",
      });
      return;
    }

    setVideoSubmitting(true);
    try {
      const response = await fetch('/api/instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoTitle.trim(),
          url: videoUrl.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Adăugarea videoclipului a eșuat');
      }

      const data = await response.json();
      setVideoclipuri([...videos, data.video]);

      setVideoTitle("");
      setVideoUrl("");
      setIsAddVideoOpen(false);

      toast({
        title: "Succes",
        description: "Videoclip adăugat cu succes!",
      });
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Adăugarea videoclipului a eșuat",
        variant: "destructive",
      });
    } finally {
      setVideoSubmitting(false);
    }
  };

  // Handle image file upload
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Eroare",
        description: "Încărcați un fișier imagine valid",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Eroare",
        description: "Fișierul imagine trebuie să fie mai mic de 5 MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
  };

  // Handle image addition
  const handleAddImage = async () => {
    if (!imageTitle.trim() || !uploadedFile) {
      toast({
        title: "Eroare",
        description: "Furnizați atât titlul cât și fișierul imagine",
        variant: "destructive",
      });
      return;
    }

    setImageSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', imageTitle.trim());
      formData.append('file', uploadedFile);

      const response = await fetch('/api/instructions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Adăugarea imaginii a eșuat');
      }

      const data = await response.json();
      setImages([...images, data.image]);

      setImageTitle("");
      setUploadedFile(null);
      setIsAddImageOpen(false);

      toast({
        title: "Succes",
        description: "Imagine adăugată cu succes!",
      });
    } catch (error) {
      console.error('Error adding image:', error);
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Adăugarea imaginii a eșuat",
        variant: "destructive",
      });
    } finally {
      setImageSubmitting(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  // Handle delete
  const handleDeleteVideo = async (id: string) => {
    try {
      const response = await fetch(`/api/instructions/${id}?type=video`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ștergerea videoclipului a eșuat');
      }

      setVideoclipuri(videos.filter(video => video.id !== id));
      toast({
        title: "Succes",
        description: "Videoclip șters cu succes!",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Ștergerea videoclipului a eșuat",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const response = await fetch(`/api/instructions/${id}?type=image`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ștergerea imaginii a eșuat');
      }

      setImages(images.filter(image => image.id !== id));
      toast({
        title: "Succes",
        description: "Imagine ștearsă cu succes!",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Ștergerea imaginii a eșuat",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Instrucțiuni tratament și exemple</h1>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="videos">Videoclipuri</TabsTrigger>
          <TabsTrigger value="images">Imagini</TabsTrigger>
        </TabsList>

        {/* Videoclipuri Tab */}
        <TabsContent value="videos">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Căutați videoclipuri…"
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
              />
            </div>

            {/* Adaugă videoclip Button */}
            <Button onClick={() => setIsAddVideoOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adaugă videoclip
            </Button>
          </div>

          {filteredVideoclipuri.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideoclipuri.map((video) => (
                <div key={video.id} className="flex flex-col items-center relative group">
                  {video.isCustom && (
                    <Button
                      onClick={() => handleDeleteVideo(video.id)}
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="w-full aspect-video overflow-hidden rounded-lg shadow-md bg-black">
                    {isDirectVideo(video.embedUrl) ? (
                      <video
                        className="w-full h-full"
                        src={video.embedUrl}
                        title={video.title}
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <iframe
                        className="w-full h-full"
                        src={video.embedUrl}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                  <p className="mt-2 text-center font-medium text-sm md:text-base px-2 line-clamp-2">
                    {video.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Niciun videoclip găsit.</p>
          )}
        </TabsContent>

        {/* Imagini Tab */}
        <TabsContent value="images">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Căutați imagini…"
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
              />
            </div>

            {/* Adaugă imagine Button */}
            <Button onClick={() => setIsAddImageOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adaugă imagine
            </Button>
          </div>

          {filteredImages.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredImages.map((img) => (
                <Dialog key={img.id}>
                  <DialogTrigger asChild>
                    <div className="flex flex-col items-center cursor-pointer relative group">
                      {img.isCustom && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(img.id);
                          }}
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <div className="w-full h-32 sm:h-40 md:h-48 overflow-hidden rounded-lg shadow border bg-background flex items-center justify-center">
                        <img
                          src={img.imageUrl}
                          alt={img.title}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <p className="mt-2 text-center text-sm md:text-base px-2 line-clamp-2 font-medium">
                        {img.title}
                      </p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <img src={img.imageUrl} alt={img.title} className="w-full h-auto rounded" />
                    <p className="text-center mt-2 font-medium">{img.title}</p>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nicio imagine găsită.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Adaugă videoclip Modal */}
      <Dialog open={isAddVideoOpen} onOpenChange={setIsAddVideoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Add YouTube Video
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                placeholder="Introduceți titlul videoclipului"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="video-url">YouTube URL</Label>
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Paste any YouTube URL format (watch, embed, or short link)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddVideo}
                className="flex-1"
                disabled={videoSubmitting}
              >
                {videoSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Adaugă videoclip"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsAddVideoOpen(false)}>
                Anulează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adaugă imagine Modal */}
      <Dialog open={isAddImageOpen} onOpenChange={setIsAddImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Adaugă imagine
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-title">Image Title</Label>
              <Input
                id="image-title"
                placeholder="Introduceți titlul imaginii"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Image File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('image-file-input')?.click()}
              >
                <input
                  id="image-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {uploadedFile ? (
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Trageți o imagine aici sau faceți clic pentru a selecta</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports JPG, PNG, GIF up to 5MB
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddImage}
                className="flex-1"
                disabled={imageSubmitting}
              >
                {imageSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Adaugă imagine"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsAddImageOpen(false)}>
                Anulează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 