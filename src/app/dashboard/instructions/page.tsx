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

export default function InstructionsPage() {
  const [videoSearch, setVideoSearch] = useState("");
  const [imageSearch, setImageSearch] = useState("");
  const [videos, setVideos] = useState<VideoItem[]>([]);
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
        throw new Error('Failed to fetch instructions');
      }
      const data = await response.json();
      setVideos(data.videos);
      setImages(data.images);
    } catch (error) {
      console.error('Error fetching instructions:', error);
      toast({
        title: "Error",
        description: "Failed to load instructions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, []);

  const filteredVideos = useMemo(() => {
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
        title: "Error",
        description: "Please provide both title and YouTube URL",
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
        throw new Error(errorData.error || 'Failed to add video');
      }

      const data = await response.json();
      setVideos([...videos, data.video]);

      setVideoTitle("");
      setVideoUrl("");
      setIsAddVideoOpen(false);

      toast({
        title: "Success",
        description: "Video added successfully!",
      });
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add video",
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
        title: "Error",
        description: "Please upload a valid image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "Image file size must be less than 5MB",
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
        title: "Error",
        description: "Please provide both title and image file",
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
        throw new Error(errorData.error || 'Failed to add image');
      }

      const data = await response.json();
      setImages([...images, data.image]);

      setImageTitle("");
      setUploadedFile(null);
      setIsAddImageOpen(false);

      toast({
        title: "Success",
        description: "Image added successfully!",
      });
    } catch (error) {
      console.error('Error adding image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add image",
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
        throw new Error(errorData.error || 'Failed to delete video');
      }

      setVideos(videos.filter(video => video.id !== id));
      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete video",
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
        throw new Error(errorData.error || 'Failed to delete image');
      }

      setImages(images.filter(image => image.id !== id));
      toast({
        title: "Success",
        description: "Image deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete image",
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
        <h1 className="text-3xl font-bold">Treatment Instructions &amp; Examples</h1>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search videos…"
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
              />
            </div>

            {/* Add Video Button */}
            <Button onClick={() => setIsAddVideoOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Video
            </Button>
          </div>

          {filteredVideos.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
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
                  <div className="w-full aspect-video overflow-hidden rounded-lg shadow-md">
                    <iframe
                      className="w-full h-full"
                      src={video.embedUrl}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="mt-2 text-center font-medium text-sm md:text-base px-2 line-clamp-2">
                    {video.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No videos found.</p>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search images…"
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
              />
            </div>

            {/* Add Image Button */}
            <Button onClick={() => setIsAddImageOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Image
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
            <p className="text-muted-foreground">No images found.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Video Modal */}
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
                placeholder="Enter video title"
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
                  "Add Video"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsAddVideoOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Image Modal */}
      <Dialog open={isAddImageOpen} onOpenChange={setIsAddImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Add Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-title">Image Title</Label>
              <Input
                id="image-title"
                placeholder="Enter image title"
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
                    <p className="text-sm font-medium">Drop an image here or click to browse</p>
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
                  "Add Image"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsAddImageOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 