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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Edit, MapIcon, Loader2 } from "lucide-react";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { toast } from "@/hooks/use-toast";

// API URL (update this to match your local environment)
const API_URL = "https://stealthlearn.in/imm-admin/api/indexEdutour.php";

const EduTour = () => {
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [tours, setTours] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTour, setCurrentTour] = useState(null);
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
    subcategory: "",
    description: "",
  });
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState(null);

  // Add default values for new uploads
  const [defaultUploadValues, setDefaultUploadValues] = useState({
    category: "Uncategorized",
    subcategory: "",
    description: "",
  });

  // Add filter states
  const [filters, setFilters] = useState({
    title: "",
    description: "",
    category: "all",
    subcategory: "",
  });

  useEffect(() => {
    setCurrentBreadcrumb("Educational Tours");
    // Load tours when component mounts
    fetchTours();
  }, [setCurrentBreadcrumb, isEditDialogOpen]);

  // Fetch tours from the API
  const fetchTours = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setTours(data);
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast({
        title: "Error",
        description: "Failed to load tours. Please try again later.",
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
        subcategory: defaultUploadValues.subcategory,
        description: defaultUploadValues.description,
      };
    });

    setUploadDetails(details);
  };

  const confirmDelete = (tour) => {
    setTourToDelete(tour);
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!tourToDelete) return;

    try {
      const response = await fetch(`${API_URL}?id=${tourToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      await response.json();

      // Update local state
      setTours(tours.filter((tour) => tour.id !== tourToDelete.id));
      toast({
        title: "Success",
        description: "Tour deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting tour:", error);
      toast({
        title: "Error",
        description: "Failed to delete tour. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTourToDelete(null);
    }
  };

  const openEditDialog = (tour) => {
    setCurrentTour(tour);
    setEditFormData({
      title: tour.title || "",
      category: tour.category || "Uncategorized",
      subcategory: tour.subcategory || "",
      description: tour.description || "",
    });
    setIsEditDialogOpen(true);
    setNewImagePreview(null);
    setNewImageFile(null);
  };

  const handleUpdateTour = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", editFormData.title);
      formData.append("category", editFormData.category);
      formData.append("subcategory", editFormData.subcategory);
      formData.append("description", editFormData.description);
      formData.append("id", currentTour.id);

      if (newImageFile) {
        formData.append("file", newImageFile);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update tour");
      }

      const updatedTour = await response.json();
      setTours(
        tours.map((tour) =>
          tour.id === currentTour.id ? { ...tour, ...updatedTour } : tour
        )
      );
      toast({ title: "Success", description: "Tour updated successfully" });
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
        formData.append("subcategory", uploadDetails[index]?.subcategory || "");
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

      // Refresh the tour list
      await fetchTours();

      // Clear selected files
      setSelectedFiles([]);
      setUploadDetails([]);

      toast({
        title: "Success",
        description: `Successfully uploaded ${results.length} tour(s)`,
      });
    } catch (error) {
      console.error("Error uploading tours:", error);
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

  // Filter function for the tours
  const filterTours = (tour) => {
    // Title filter
    if (
      filters.title &&
      !tour.title?.toLowerCase().includes(filters.title.toLowerCase())
    ) {
      return false;
    }

    // Description filter
    if (
      filters.description &&
      !tour.description
        ?.toLowerCase()
        .includes(filters.description.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (filters.category !== "all" && tour.category !== filters.category) {
      return false;
    }

    // Subcategory filter
    if (
      filters.subcategory &&
      !tour.subcategory
        ?.toLowerCase()
        .includes(filters.subcategory.toLowerCase())
    ) {
      return false;
    }

    return true;
  };

  const clearFilters = () => {
    setFilters({
      title: "",
      description: "",
      category: "all",
      subcategory: "",
    });
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

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg mx-auto p-6 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Educational Tours</h1>
        <div className="text-sm text-gray-500">
          {!isLoading && (
            <>
              Showing {tours.filter(filterTours).length} of {tours.length} tours
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
              <div className="grid gap-4 md:grid-cols-2">
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
                      <SelectItem value="Uncategorized">
                        Uncategorized
                      </SelectItem>
                      <SelectItem value="International">
                        International
                      </SelectItem>
                      <SelectItem value="National">National</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="default-subcategory">Subcategory</Label>
                  <Input
                    id="default-subcategory"
                    value={defaultUploadValues.subcategory}
                    onChange={(e) =>
                      handleDefaultValueChange("subcategory", e.target.value)
                    }
                    placeholder="Enter default subcategory"
                  />
                </div>
                {/* <div className="grid gap-2">
                  <Label htmlFor="default-description">Description</Label>
                  <Input
                    id="default-description"
                    value={defaultUploadValues.description}
                    onChange={(e) =>
                      handleDefaultValueChange("description", e.target.value)
                    }
                    placeholder="Enter default description"
                  />
                </div> */}
              </div>
            </div>

            {/* File upload area */}
            <div
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer dark:bg-black dark:hover:bg-gray-950"
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
                          placeholder="Enter tour title"
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
                            <SelectItem value="International">
                              International
                            </SelectItem>
                            <SelectItem value="National">National</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`subcategory-${index}`}>
                          Subcategory
                        </Label>
                        <Input
                          id={`subcategory-${index}`}
                          value={uploadDetails[index]?.subcategory || ""}
                          onChange={(e) =>
                            updateUploadDetail(
                              index,
                              "subcategory",
                              e.target.value
                            )
                          }
                          placeholder="Enter subcategory"
                        />
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
                          placeholder="Enter tour description"
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
                        selectedFiles.length === 1 ? "Tour" : "Tours"
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
      ) : tours.length > 0 ? (
        <>
          {/* Filter controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Filter Tours</h3>
              <div className="grid gap-4 md:grid-cols-4">
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
                      <SelectItem value="Uncategorized">
                        Uncategorized
                      </SelectItem>
                      <SelectItem value="International">
                        International
                      </SelectItem>
                      <SelectItem value="National">National</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subcategory-filter">Subcategory</Label>
                  <Input
                    id="subcategory-filter"
                    placeholder="Filter by subcategory"
                    value={filters.subcategory}
                    onChange={(e) =>
                      handleFilterChange("subcategory", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {tours.filter(filterTours).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tours.filter(filterTours).map((tour) => (
                <Card key={tour.id} className="overflow-hidden group">
                  <div className="relative aspect-square">
                    <img
                      src={tour.url || "/placeholder.svg"}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white text-gray-700 mr-2 hover:bg-gray-200"
                        onClick={() => openEditDialog(tour)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white text-gray-700 hover:bg-gray-200"
                        onClick={() => confirmDelete(tour)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {tour.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{tour.category}</p>
                      {tour.subcategory && (
                        <p className="text-xs text-gray-500">
                          {tour.subcategory}
                        </p>
                      )}
                    </div>
                    {tour.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {tour.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <MapIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No tours found matching the selected filters
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
            <MapIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No tours yet
          </h3>
          <p className="text-gray-500 mb-4">Upload tours to see them here</p>
          <Button onClick={triggerFileInput}>Upload Tours</Button>
        </div>
      )}

      {/* Edit Dialog */}
      {currentTour && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tour Details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTour}>
              <div className="grid gap-4 py-4">
                <div className="relative mb-4 group">
                  <img
                    src={
                      newImagePreview || currentTour.url || "/placeholder.svg"
                    }
                    alt={currentTour.title}
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
                      <SelectItem value="International">
                        International
                      </SelectItem>
                      <SelectItem value="National">National</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    name="subcategory"
                    value={editFormData.subcategory}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        subcategory: e.target.value,
                      })
                    }
                    placeholder="Enter subcategory"
                  />
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
                    placeholder="Enter tour description"
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

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              tour and remove the data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EduTour;
