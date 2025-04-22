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
const API_URL = "https://stealthlearn.in/imm-admin/api/index.php";

const Research = () => {
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
    category: "Uncategorized Research",
    description: "",
  });

  // Add default values for new uploads
  const [defaultUploadValues, setDefaultUploadValues] = useState({
    category: "Uncategorized Research",
  });

  // Add filter states
  const [filters, setFilters] = useState({
    title: "",
    description: "",
    category: "all",
  });

  useEffect(() => {
    setCurrentBreadcrumb("Research");
    // Load images when component mounts
    fetchImages();
  }, [setCurrentBreadcrumb, isEditDialogOpen]);

  // Fetch images from the API
  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setImages(
        data.filter(
          (image) =>
            image.category === "Uncategorized Research" ||
            image.category === "International" ||
            image.category === "National"
        )
      );
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
      category: defaultUploadValues.category,
      description: "",
    }));

    setUploadDetails(details);
  };

  // Handle changes to default upload values
  const handleDefaultValueChange = (field, value) => {
    setDefaultUploadValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Also update all current upload details with this new value
    if (selectedFiles.length > 0) {
      setUploadDetails((prev) =>
        prev.map((detail) => ({
          ...detail,
          [field]: value,
        }))
      );
    }
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
      category: image.category || "Uncategorized Research",
      description: image.description || "",
    });
    setIsEditDialogOpen(true);
    setNewImagePreview(null);
    setNewImageFile(null);
  };

  const handleUpdateImage = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", editFormData.title);
      formData.append("category", editFormData.category);
      formData.append("description", editFormData.description);
      formData.append("id", currentImage.id);

      if (newImageFile) {
        formData.append("file", newImageFile);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update image");
      }

      const updatedImage = await response.json();
      setImages(
        images.map((image) =>
          image.id === currentImage.id ? { ...image, ...updatedImage } : image
        )
      );
      toast({ title: "Success", description: "Image updated successfully" });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
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
          uploadDetails[index]?.category || "Uncategorized Research"
        );
        formData.append("description", uploadDetails[index]?.description || "");

        const response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);

          // Try to parse as JSON if possible
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(
              errorJson.error ||
                errorJson.message ||
                `HTTP error! Status: ${response.status}`
            );
          } catch {
            // If not JSON, throw with the text or status
            throw new Error(
              `Upload failed (${response.status}): ${errorText.substring(
                0,
                100
              )}...`
            );
          }
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
        description: `Failed to upload: ${error.message}`,
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

  // Add filter handler
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Filter function for the images
  const filterImages = (image) => {
    // Title filter
    if (
      filters.title &&
      !image.title?.toLowerCase().includes(filters.title.toLowerCase())
    ) {
      return false;
    }

    // Description filter
    if (
      filters.description &&
      !image.description
        ?.toLowerCase()
        .includes(filters.description.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (filters.category !== "all" && image.category !== filters.category) {
      return false;
    }

    return true;
  };

  const clearFilters = () => {
    setFilters({
      title: "",
      description: "",
      category: "all",
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg mx-auto p-6 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Research Conference</h1>
        <div className="text-sm text-gray-500">
          {!isLoading && (
            <>
              Showing {images.filter(filterImages).length} of {images.length}{" "}
              items
            </>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Default values section */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-3">Default Upload Settings</h3>
              <p className="text-sm text-gray-500 mb-4">
                Set these values before selecting files to apply them to all
                uploads
              </p>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="default-category">Category</Label>
                  <Select
                    value={defaultUploadValues.category}
                    onValueChange={(value) =>
                      handleDefaultValueChange("category", value)
                    }
                  >
                    <SelectTrigger id="default-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Uncategorized Research">
                        Uncategorized Research
                      </SelectItem>
                      <SelectItem value="International">
                        International Conference
                      </SelectItem>
                      <SelectItem value="National">
                        National Conference
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

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
                            uploadDetails[index]?.category ||
                            "Uncategorized Research"
                          }
                          onValueChange={(value) =>
                            updateUploadDetail(index, "category", value)
                          }
                        >
                          <SelectTrigger id={`category-${index}`}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Uncategorized Research">
                              Uncategorized Research
                            </SelectItem>
                            <SelectItem value="International">
                              International Conference
                            </SelectItem>
                            <SelectItem value="National">
                              National Conference
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`description-${index}`}>
                          Description
                        </Label>
                        <Input
                          id={`description-${index}`}
                          value={uploadDetails[index]?.description || ""}
                          onChange={(e) =>
                            updateUploadDetail(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Enter image description"
                        />
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
        <>
          {/* Filter controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Filter Gallery</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="title-filter">Title</Label>
                  <Input
                    id="title-filter"
                    placeholder="Filter by title"
                    value={filters.title}
                    onChange={(e) =>
                      handleFilterChange("title", e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description-filter">Description</Label>
                  <Input
                    id="description-filter"
                    placeholder="Filter by description"
                    value={filters.description}
                    onChange={(e) =>
                      handleFilterChange("description", e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category-filter">Category</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      handleFilterChange("category", value)
                    }
                  >
                    <SelectTrigger id="category-filter">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Uncategorized Research">
                        Uncategorized Research
                      </SelectItem>
                      <SelectItem value="International">
                        International Conference
                      </SelectItem>
                      <SelectItem value="National">
                        National Conference
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {images.filter(filterImages).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.filter(filterImages).map((image) => (
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
                    <h3 className="font-medium text-sm truncate">
                      {image.title}
                    </h3>
                    <p className="text-xs text-gray-500">{image.category}</p>
                    {image.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {image.description}
                      </p>
                    )}
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
                No research items found matching the selected filters
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search criteria
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          )}
        </>
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
                      <SelectItem value="Uncategorized Research">
                        Uncategorized Research
                      </SelectItem>
                      <SelectItem value="Nature">Nature</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="People">People</SelectItem>
                      <SelectItem value="Architecture">Architecture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter image description"
                  />
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

export default Research;
