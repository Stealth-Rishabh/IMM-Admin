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
const API_URL = "https://stealthlearn.in/imm-admin/api/indexBanner.php";

const BannerManager = () => {
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [banners, setBanners] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
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

  // Add default values for new uploads
  const [defaultUploadValues, setDefaultUploadValues] = useState({
    category: "Uncategorized",
  });

  // Add filter states
  const [filters, setFilters] = useState({
    title: "",
    category: "all",
  });

  useEffect(() => {
    setCurrentBreadcrumb("Banner Manager");
    // Load banners when component mounts
    fetchBanners();
  }, [setCurrentBreadcrumb, isEditDialogOpen]);

  // Fetch banners from the API
  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast({
        title: "Error",
        description: "Failed to load banners. Please try again later.",
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
    const details = files.map((file) => {
      let title = file.name;
      // Remove _11zon patterns with regex
      title = title.replace(/_\d*_?11zon/g, "");
      // Get everything before the last period
      title = title.substring(0, title.lastIndexOf(".")) || title;

      return {
        title,
        category: defaultUploadValues.category,
      };
    });

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
    if (!window.confirm("Are you sure you want to delete this banner?")) {
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
      setBanners(banners.filter((banner) => banner.id !== id));
      toast({
        title: "Success",
        description: "Banner deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast({
        title: "Error",
        description: "Failed to delete banner. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (banner) => {
    setCurrentBanner(banner);
    setEditFormData({
      title: banner.title || "",
      category: banner.category || "Uncategorized",
    });
    setIsEditDialogOpen(true);
    setNewImagePreview(null);
    setNewImageFile(null);
  };

  const handleUpdateBanner = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", editFormData.title);
      formData.append("category", editFormData.category);
      formData.append("id", currentBanner.id);

      if (newImageFile) {
        formData.append("file", newImageFile);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update banner");
      }

      const updatedBanner = await response.json();
      setBanners(
        banners.map((banner) =>
          banner.id === currentBanner.id
            ? { ...banner, ...updatedBanner }
            : banner
        )
      );
      toast({ title: "Success", description: "Banner updated successfully" });
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
          uploadDetails[index]?.category || "Uncategorized"
        );

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

      // Refresh the banner list
      await fetchBanners();

      // Clear selected files
      setSelectedFiles([]);
      setUploadDetails([]);

      toast({
        title: "Success",
        description: `Successfully uploaded ${results.length} banner(s)`,
      });
    } catch (error) {
      console.error("Error uploading banners:", error);
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

  // Filter function for the banners
  const filterBanners = (banner) => {
    // Title filter
    if (
      filters.title &&
      !banner.title?.toLowerCase().includes(filters.title.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (filters.category !== "all" && banner.category !== filters.category) {
      return false;
    }

    return true;
  };

  const clearFilters = () => {
    setFilters({
      title: "",
      category: "all",
    });
  };

  const bannerCategories = [
    "Uncategorized",
    "Slider1",
    "Slider2",
    "Slider3",
    "Slider4",
    "Slider5",
    "IMM Legacy",
    "Leadership",
    "Advisory Board",
    "Accreditations & Awards",
    "IMM Partners",
    "PGDM",
    "BBA",
    "Admissions",
    "Industry Lectures & Webinars",
    "Industry Visits",
    "Corporate Events",
    "Recruit and Partner",
    "Faculty",
    "Research",
    "Events & Activities",
    "Clubs at IMM",
    "State-of-the Art Campus",
    "Campus Recruitment",
    "Placement Records",
    "Dazzling Divas",
    "Hall of Fame",
    "Alumni Connect",
    "Career",
    "Contact Us",
  ];

  return (
    <div className="border border-gray-200 rounded-lg mx-auto p-6 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Banner Manager</h1>
        <div className="text-sm text-gray-500">
          {!isLoading && (
            <>
              Showing {banners.filter(filterBanners).length} of{" "}
              {banners.filter(filterBanners).length} banners
            </>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Default values section */}
            {/* <div className="border rounded-lg p-4 mb-4">
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
                      {bannerCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div> */}

            <div
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300  dark:border-gray-700 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer dark:bg-black  dark:hover:bg-gray-950"
              onClick={triggerFileInput}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  handleFileChange({ target: { files } });
                }
              }}
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
                          placeholder="Enter banner title"
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
                            {bannerCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
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
                        selectedFiles.length === 1 ? "Banner" : "Banners"
                      }`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banner Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      ) : banners.length > 0 ? (
        <>
          {/* Filter controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Filter Banners</h3>
              <div className="grid gap-4 md:grid-cols-2">
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
                      {bannerCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {banners.filter(filterBanners).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {banners.filter(filterBanners).map((banner) => (
                <Card key={banner.id} className="overflow-hidden group">
                  <div className="relative aspect-[22/10]">
                    <img
                      src={banner.url || "/placeholder.svg"}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white text-gray-700 mr-2 hover:bg-gray-200"
                        onClick={() => openEditDialog(banner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white text-gray-700 hover:bg-gray-200"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {banner.title}
                    </h3>
                    <p className="text-xs text-gray-500">{banner.category}</p>
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
                No banners found matching the selected filters
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
            No banners yet
          </h3>
          <p className="text-gray-500 mb-4">Upload banners to see them here</p>
          <Button onClick={triggerFileInput}>Upload Banners</Button>
        </div>
      )}

      {/* Edit Dialog */}
      {currentBanner && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Banner Details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateBanner}>
              <div className="grid gap-4 py-4">
                <div className="relative mb-4 group">
                  <img
                    src={
                      newImagePreview || currentBanner.url || "/placeholder.svg"
                    }
                    alt={currentBanner.title}
                    className="w-full h-36 object-contain rounded-md"
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
                      {bannerCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
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

export default BannerManager;
