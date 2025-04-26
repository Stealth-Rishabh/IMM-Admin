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
} from "@/components/ui/alert-dialog";
import { Upload, X, Edit, ImageIcon, Loader2 } from "lucide-react";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const API_URL = "https://stealthlearn.in/imm-admin/api/indexTestimonial.php";

const TestimonialGallery = () => {
  const { setCurrentBreadcrumb } = useBreadcrumb();
  const [testimonials, setTestimonials] = useState([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadDetails, setUploadDetails] = useState([]);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const replaceFileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    position: "",
    testimonial: "",
    link: "",
  });

  const [filters, setFilters] = useState({
    name: "",
    position: "",
    testimonial: "",
    link: "",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);

  useEffect(() => {
    setCurrentBreadcrumb("Testimonials");
    fetchTestimonials();
  }, [setCurrentBreadcrumb, isEditDialogOpen]);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setTestimonials(data);
      setFilteredTestimonials(data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast({
        title: "Error",
        description: "Failed to load testimonials. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    const details = files.map((file) => {
      let name = file.name;
      name = name.replace(/_\d*_?11zon/g, "");
      name = name.substring(0, name.lastIndexOf(".")) || name;

      return {
        name,
        position: "",
        testimonial: "",
        link: "",
      };
    });

    setUploadDetails(details);
  };

  const handleDelete = async (id) => {
    setTestimonialToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!testimonialToDelete) return;

    try {
      const response = await fetch(`${API_URL}?id=${testimonialToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      await response.json();
      setTestimonials((prevTestimonials) =>
        prevTestimonials.filter(
          (testimonial) => testimonial.id !== testimonialToDelete
        )
      );
      setFilteredTestimonials((prevFiltered) =>
        prevFiltered.filter(
          (testimonial) => testimonial.id !== testimonialToDelete
        )
      );
      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast({
        title: "Error",
        description: "Failed to delete testimonial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
    }
  };

  const openEditDialog = (testimonial) => {
    setCurrentTestimonial(testimonial);
    setEditFormData({
      name: testimonial.name || "",
      position: testimonial.position || "",
      testimonial: testimonial.testimonial || "",
      link: testimonial.link || "",
    });
    setIsEditDialogOpen(true);
    setNewImagePreview(null);
    setNewImageFile(null);
  };

  const handleUpdateTestimonial = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("name", editFormData.name);
      formData.append("position", editFormData.position);
      formData.append("testimonial", editFormData.testimonial);
      formData.append("link", editFormData.link);
      formData.append("id", currentTestimonial.id);

      if (newImageFile) {
        formData.append("file", newImageFile);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update testimonial");
      }

      const updatedTestimonial = await response.json();
      setTestimonials(
        testimonials.map((testimonial) =>
          testimonial.id === currentTestimonial.id
            ? { ...testimonial, ...updatedTestimonial }
            : testimonial
        )
      );
      toast({
        title: "Success",
        description: "Testimonial updated successfully",
      });
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
          "name",
          uploadDetails[index]?.name ||
            file.name
              .replace(/_\d*_?11zon/g, "")
              .substring(
                0,
                file.name.replace(/_\d*_?11zon/g, "").lastIndexOf(".")
              )
        );
        formData.append("position", uploadDetails[index]?.position || "");
        formData.append("testimonial", uploadDetails[index]?.testimonial || "");
        formData.append("link", uploadDetails[index]?.link || "");

        const response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);

          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(
              errorJson.error ||
                errorJson.message ||
                `HTTP error! Status: ${response.status}`
            );
          } catch {
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
      await fetchTestimonials();
      setSelectedFiles([]);
      setUploadDetails([]);

      toast({
        title: "Success",
        description: `Successfully uploaded ${results.length} testimonial(s)`,
      });
    } catch (error) {
      console.error("Error uploading testimonials:", error);
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

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const filterTestimonials = (testimonial) => {
    if (
      filters.name &&
      !testimonial.name?.toLowerCase().includes(filters.name.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.position &&
      !testimonial.position
        ?.toLowerCase()
        .includes(filters.position.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.testimonial &&
      !testimonial.testimonial
        ?.toLowerCase()
        .includes(filters.testimonial.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.link &&
      !testimonial.link?.toLowerCase().includes(filters.link.toLowerCase())
    ) {
      return false;
    }

    return true;
  };

  return (
    <div className="border border-gray-200 rounded-lg mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <div className="text-sm text-gray-500">
          {!isLoading && (
            <>
              Showing {filteredTestimonials.filter(filterTestimonials).length}{" "}
              of {testimonials.length} testimonials
            </>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
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
                        <Label htmlFor={`name-${index}`}>Name</Label>
                        <Input
                          id={`name-${index}`}
                          value={
                            uploadDetails[index]?.name ||
                            file.name
                              .replace(/_\d*_?11zon/g, "")
                              .substring(
                                0,
                                file.name
                                  .replace(/_\d*_?11zon/g, "")
                                  .lastIndexOf(".")
                              )
                          }
                          onChange={(e) =>
                            updateUploadDetail(index, "name", e.target.value)
                          }
                          placeholder="Enter name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`position-${index}`}>Position</Label>
                        <Input
                          id={`position-${index}`}
                          value={uploadDetails[index]?.position || ""}
                          onChange={(e) =>
                            updateUploadDetail(
                              index,
                              "position",
                              e.target.value
                            )
                          }
                          placeholder="Enter position"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`testimonial-${index}`}>
                          Testimonial
                        </Label>
                        <Textarea
                          id={`testimonial-${index}`}
                          value={uploadDetails[index]?.testimonial || ""}
                          onChange={(e) =>
                            updateUploadDetail(
                              index,
                              "testimonial",
                              e.target.value
                            )
                          }
                          placeholder="Enter testimonial"
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`link-${index}`}>Link</Label>
                        <Input
                          id={`link-${index}`}
                          value={uploadDetails[index]?.link || ""}
                          onChange={(e) =>
                            updateUploadDetail(index, "link", e.target.value)
                          }
                          placeholder="Enter link"
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
                        selectedFiles.length === 1
                          ? "Testimonial"
                          : "Testimonials"
                      }`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Filter Testimonials</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="name-filter">Name</Label>
              <Input
                id="name-filter"
                placeholder="Filter by name"
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position-filter">Position</Label>
              <Input
                id="position-filter"
                placeholder="Filter by position"
                value={filters.position}
                onChange={(e) => handleFilterChange("position", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="testimonial-filter">Testimonial</Label>
              <Input
                id="testimonial-filter"
                placeholder="Filter by testimonial"
                value={filters.testimonial}
                onChange={(e) =>
                  handleFilterChange("testimonial", e.target.value)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-filter">Link</Label>
              <Input
                id="link-filter"
                placeholder="Filter by link"
                value={filters.link}
                onChange={(e) => handleFilterChange("link", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      ) : filteredTestimonials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTestimonials
            .filter(filterTestimonials)
            .map((testimonial) => (
              <Card key={testimonial.id} className="overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={testimonial.url || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-white text-gray-700 mr-2 hover:bg-gray-200"
                      onClick={() => openEditDialog(testimonial)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-white text-gray-700 hover:bg-gray-200"
                      onClick={() => handleDelete(testimonial.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">
                    {testimonial.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {testimonial.position}
                  </p>
                  {testimonial.testimonial && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {testimonial.testimonial}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      ) : testimonials.length > 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No testimonials found matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No testimonials yet
          </h3>
          <p className="text-gray-500 mb-4">
            Upload testimonials to see them here
          </p>
          <Button onClick={triggerFileInput}>Upload Testimonials</Button>
        </div>
      )}

      {/* Edit Dialog */}
      {currentTestimonial && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Testimonial Details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTestimonial}>
              <div className="grid gap-4 py-4">
                <div className="relative mb-4 group">
                  <img
                    src={
                      newImagePreview ||
                      currentTestimonial.url ||
                      "/placeholder.svg"
                    }
                    alt={currentTestimonial.name}
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
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    value={editFormData.position}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        position: e.target.value,
                      })
                    }
                    placeholder="Enter position"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="testimonial">Testimonial</Label>
                  <Textarea
                    id="testimonial"
                    name="testimonial"
                    value={editFormData.testimonial}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        testimonial: e.target.value,
                      })
                    }
                    placeholder="Enter testimonial"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="link">Link</Label>
                  <Input
                    id="link"
                    name="link"
                    value={editFormData.link}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        link: e.target.value,
                      })
                    }
                    placeholder="Enter link"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              testimonial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

export default TestimonialGallery;
