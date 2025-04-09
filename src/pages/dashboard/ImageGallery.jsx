"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Edit, ImageIcon, Loader2 } from "lucide-react";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { toast } from "@/hooks/use-toast";

// API URL (update this to match your local environment)
const API_URL = "http://localhost/api/index.php";

const ImageGallery = () => {
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [images, setImages] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadDetails, setUploadDetails] = useState([]);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const replaceFileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    category: "Uncategorized",
  });

  useEffect(() => {
    setCurrentBreadcrumb("Image Gallery");
    // Load images when component mounts
    fetchImages();
  }, [setCurrentBreadcrumb]);

  // Fetch images from the API
  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "Failed to load images. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Initialize upload details with default values
    const details = files.map((file) => ({
      title: file.name.split(".")[0],
      category: "Uncategorized",
    }));

    setUploadDetails(details);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      await response.json();

      // Update local state
      setImages(images.filter((image) => image.id !== id));
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (image) => {
    setCurrentImage(image);
    setEditFormData({
      title: image.title || "",
      category: image.category || "Uncategorized",
    });
    setIsEditDialogOpen(true);
    setNewImagePreview(null);
    setNewImageFile(null);
  };

  const handleUpdateImage = async (e) => {
    e.preventDefault();
    console.log("Update function called", currentImage);

    // Show loading state
    setIsUploading(true);

    try {
      // Important: Add the ID to the URL instead of form data for more reliable handling
      const updateUrl = `${API_URL}?id=${currentImage.id}`;
      console.log("Using update URL:", updateUrl);

      // Create FormData object explicitly (don't use the event target form)
      const formData = new FormData();

      // Add fields manually to ensure they're included
      formData.append("title", editFormData.title);
      formData.append("category", editFormData.category);
      formData.append("id", currentImage.id);

      console.log("Form values being sent:", {
        title: editFormData.title,
        category: editFormData.category,
        id: currentImage.id,
      });

      // If we have a new image file, add it to the form data
      if (newImageFile) {
        formData.append("file", newImageFile);
        console.log("Adding new image file:", newImageFile.name);
      }

      // Log all form data entries for debugging
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      // Send the update request
      const response = await fetch(updateUrl, {
        method: "PUT",
        body: formData,
      });

      // Check for non-OK response and handle appropriately
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      const updatedImage = await response.json();
      console.log("Update response:", updatedImage);

      // Update local state with the new image data
      setImages(
        images.map((image) =>
          image.id === currentImage.id
            ? {
                ...image,
                title: editFormData.title,
                category: editFormData.category,
                url: updatedImage.url || image.url,
              }
            : image
        )
      );

      toast({
        title: "Success",
        description: "Image updated successfully",
      });

      // Explicitly close the dialog and clean up state
      setIsEditDialogOpen(false);
      setNewImageFile(null);
      setNewImagePreview(null);
    } catch (error) {
      console.error("Error updating image:", error);
      toast({
        title: "Error",
        description: `Failed to update image: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      // Reset loading state
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateUploadDetail = (index, field, value) => {
    setUploadDetails((prev) => {
      const newDetails = [...prev];
      if (!newDetails[index]) {
        newDetails[index] = {};
      }
      newDetails[index] = { ...newDetails[index], [field]: value };
      return newDetails;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "title",
          uploadDetails[index]?.title || file.name.split(".")[0]
        );
        formData.append(
          "category",
          uploadDetails[index]?.category || "Uncategorized"
        );

        const response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
      });

      const results = await Promise.all(uploadPromises);

      // Refresh the image list
      await fetchImages();

      // Clear selected files
      setSelectedFiles([]);
      setUploadDetails([]);

      toast({
        title: "Success",
        description: `Successfully uploaded ${results.length} image(s)`,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Error",
        description: "Failed to upload one or more images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerReplaceFileInput = () => {
    replaceFileInputRef.current.click();
  };

  const handleReplaceImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg mx-auto p-6 ">
      <h1 className="text-2xl font-bold mb-6">Image Gallery</h1>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={triggerFileInput}
            >
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Upload Details</h3>
                <div className="space-y-4">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="grid gap-3 p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={
                              URL.createObjectURL(file) || "/placeholder.svg"
                            }
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.round(file.size / 1024)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeSelectedFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`title-${index}`}>Title</Label>
                        <Input
                          id={`title-${index}`}
                          value={
                            uploadDetails[index]?.title ||
                            file.name.split(".")[0]
                          }
                          onChange={(e) =>
                            updateUploadDetail(index, "title", e.target.value)
                          }
                          placeholder="Enter image title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`category-${index}`}>Category</Label>
                        <Select
                          value={
                            uploadDetails[index]?.category || "Uncategorized"
                          }
                          onValueChange={(value) =>
                            updateUploadDetail(index, "category", value)
                          }
                        >
                          <SelectTrigger id={`category-${index}`}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Uncategorized">
                              Uncategorized
                            </SelectItem>
                            <SelectItem value="Nature">Nature</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Food">Food</SelectItem>
                            <SelectItem value="People">People</SelectItem>
                            <SelectItem value="Architecture">
                              Architecture
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={handleUpload}
                    className="w-full"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${selectedFiles.length} ${
                        selectedFiles.length === 1 ? "Image" : "Images"
                      }`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden group">
              <div className="relative aspect-square">
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white text-gray-700 mr-2 hover:bg-gray-200"
                    onClick={() => openEditDialog(image)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white text-gray-700 hover:bg-gray-200"
                    onClick={() => handleDelete(image.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">{image.title}</h3>
                <p className="text-xs text-gray-500">{image.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No images yet
          </h3>
          <p className="text-gray-500 mb-4">Upload images to see them here</p>
          <Button onClick={triggerFileInput}>Upload Images</Button>
        </div>
      )}

      {/* Edit Dialog */}
      {currentImage && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Image Details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateImage}>
              <div className="grid gap-4 py-4">
                <div className="relative mb-4 group">
                  <img
                    src={
                      newImagePreview || currentImage.url || "/placeholder.svg"
                    }
                    alt={currentImage.title}
                    className="w-full h-40 object-contain rounded-md"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-30 transition-opacity rounded-md">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={triggerReplaceFileInput}
                    >
                      Replace Image
                    </Button>
                    <input
                      type="file"
                      ref={replaceFileInputRef}
                      onChange={handleReplaceImage}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    name="category"
                    value={editFormData.category}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Uncategorized">
                        Uncategorized
                      </SelectItem>
                      <SelectItem value="Nature">Nature</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="People">People</SelectItem>
                      <SelectItem value="Architecture">Architecture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ImageGallery;
