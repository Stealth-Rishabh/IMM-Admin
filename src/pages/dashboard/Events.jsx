"use client";

import { useState, useRef, useEffect } from "react";
import {
  PlusCircle,
  X,
  Calendar,
  Tag,
  Edit,
  Trash2,
  Upload,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../services/eventActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

const Fetch_URL = "https://stealthlearn.in/imm-admin/api/";
export default function Events() {
  const { setCurrentBreadcrumb } = useBreadcrumb();

  useEffect(() => {
    setCurrentBreadcrumb("Events");
  }, [setCurrentBreadcrumb]);

  const [events, setEvents] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch(
          "https://stealthlearn.in/imm-admin/api/index2.php?resource=events"
        );
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };
    loadEvents();
  }, []);

  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState([]);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const thumbnailInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const editThumbnailInputRef = useRef(null);
  const editGalleryInputRef = useRef(null);

  const handleAddTag = () => {
    if (newTag.trim() !== "") {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e) => {
    const files = e.target.files;
    if (files) {
      const newPreviews = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target?.result);
          if (newPreviews.length === files.length) {
            setGalleryPreviews([...galleryPreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryPreview = (index) => {
    setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (formData) => {
    setIsCreating(true);

    const eventData = {
      id: events.length > 0 ? Math.max(...events.map((e) => e.id)) + 1 : 1,
      image: thumbnailPreview || "https://v0.dev/placeholder.svg",
      date: formData.get("date"),
      category: formData.get("category"),
      title: formData.get("title"),
      tags: tags,
      description: formData.get("description"),
      gallery: galleryPreviews,
    };

    try {
      // Call the server action to create the event
      const createdEvent = await createEvent(eventData);

      // Update the local state with the returned event
      setEvents([...events, createdEvent]);

      // Reset form fields
      setTags([]);
      setThumbnailPreview(null);
      setGalleryPreviews([]);

      // Reset the form
      const form = document.getElementById("event-form");
      form.reset();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setTags(event.tags);
    setThumbnailPreview(event.image);
    setGalleryPreviews(event.gallery);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (formData) => {
    if (!editingEvent) return;

    const updatedEvent = {
      id: editingEvent.id,
      image: thumbnailPreview || editingEvent.image,
      date: formData.get("edit-date"),
      category: formData.get("edit-category"),
      title: formData.get("edit-title"),
      tags: tags,
      description: formData.get("edit-description"),
      gallery: galleryPreviews,
    };

    try {
      // Call the server action to update the event
      await updateEvent(updatedEvent);

      // Update the local state
      setEvents(
        events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      );

      // Close the dialog
      setIsEditDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const confirmDelete = (id) => {
    setEventToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (eventToDelete === null) return;

    try {
      // Call the server action to delete the event
      await deleteEvent(eventToDelete);

      // Update the local state
      setEvents(events.filter((e) => e.id !== eventToDelete));

      // Close the dialog
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="mx-auto space-y-8">
      <div className="p-6 bg-white border shadow-sm dark:bg-gray-950 rounded-xl">
        <h1 className="mb-6 text-2xl font-bold">Event Management</h1>

        <Tabs defaultValue="create">
          <TabsList className="mb-6">
            <TabsTrigger value="create">Create Event</TabsTrigger>
            <TabsTrigger value="manage">
              Manage Events ({events.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <form id="event-form" action={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Event Title
                  </label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium">
                    Event Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Input
                    id="category"
                    name="category"
                    placeholder="education, workshop, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="pl-10"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                    </div>
                    <Button type="button" onClick={handleAddTag} size="sm">
                      Add
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thumbnail Image</label>
                  <div className="p-4 space-y-4 border rounded-lg">
                    <div
                      className="flex flex-col items-center justify-center p-6 transition-colors border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <ImagePlus className="w-10 h-10 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload thumbnail
                      </p>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailChange}
                      />
                    </div>

                    {thumbnailPreview && (
                      <div className="relative overflow-hidden rounded-lg aspect-video">
                        <img
                          src={
                            thumbnailPreview &&
                            typeof thumbnailPreview === "string" &&
                            !thumbnailPreview.includes("data:") &&
                            !thumbnailPreview.includes("http")
                              ? `${Fetch_URL}${thumbnailPreview}`
                              : thumbnailPreview || "/placeholder.svg"
                          }
                          alt="Thumbnail preview"
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute w-6 h-6 rounded-full top-2 right-2"
                          onClick={() => setThumbnailPreview(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Gallery Images</label>
                  <div className="p-4 space-y-4 border rounded-lg">
                    <div
                      className="flex flex-col items-center justify-center p-6 transition-colors border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload gallery images
                      </p>
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleGalleryChange}
                      />
                    </div>

                    {galleryPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {galleryPreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="relative overflow-hidden rounded-lg aspect-square"
                          >
                            <img
                              src={
                                preview &&
                                typeof preview === "string" &&
                                !preview.includes("data:") &&
                                !preview.includes("http")
                                  ? `${Fetch_URL}${preview}`
                                  : preview || "/placeholder.svg"
                              }
                              alt={`Gallery image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute w-5 h-5 rounded-full top-1 right-1"
                              onClick={() => removeGalleryPreview(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter event description"
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="manage">
            {events.length === 0 ? (
              <div className="p-12 text-center border rounded-lg bg-muted/50">
                <p className="text-muted-foreground">
                  No events have been created yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {events.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="md:flex">
                      <div className="relative h-48 md:h-auto md:w-1/4">
                        <img
                          src={
                            event.image && !event.image.includes("http")
                              ? `${Fetch_URL}${event.image}`
                              : event.image || "/placeholder.svg"
                          }
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="flex flex-col p-6 md:w-3/4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge>{event.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {event.date}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(event)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => confirmDelete(event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                          {event.title}
                        </h3>
                        <p className="flex-grow mb-4 text-muted-foreground line-clamp-3">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {event.gallery.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-sm font-medium">
                              Gallery ({event.gallery.length})
                            </p>
                            <div className="flex gap-2 pb-2 overflow-x-auto">
                              {event.gallery.map((img, index) => (
                                <div
                                  key={index}
                                  className="relative flex-shrink-0 w-16 h-16"
                                >
                                  <img
                                    src={
                                      img && !img.includes("http")
                                        ? `${Fetch_URL}${img}`
                                        : img || "/placeholder.svg"
                                    }
                                    alt={`Gallery image ${index + 1}`}
                                    fill
                                    className="object-cover rounded-md"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Make changes to the event details below.
            </DialogDescription>
          </DialogHeader>

          {editingEvent && (
            <form action={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="edit-title" className="text-sm font-medium">
                    Event Title
                  </label>
                  <Input
                    id="edit-title"
                    name="edit-title"
                    defaultValue={editingEvent.title}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-date" className="text-sm font-medium">
                    Event Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-date"
                      name="edit-date"
                      type="date"
                      defaultValue={
                        new Date(editingEvent.date).toISOString().split("T")[0]
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-category"
                    className="text-sm font-medium"
                  >
                    Category
                  </label>
                  <Input
                    id="edit-category"
                    name="edit-category"
                    defaultValue={editingEvent.category}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="pl-10"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                    </div>
                    <Button type="button" onClick={handleAddTag} size="sm">
                      Add
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thumbnail Image</label>
                  <div className="p-4 space-y-4 border rounded-lg">
                    <div
                      className="flex flex-col items-center justify-center p-6 transition-colors border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => editThumbnailInputRef.current?.click()}
                    >
                      <ImagePlus className="w-10 h-10 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload new thumbnail
                      </p>
                      <input
                        ref={editThumbnailInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailChange}
                      />
                    </div>

                    {thumbnailPreview && (
                      <div className="relative overflow-hidden rounded-lg aspect-video">
                        <img
                          src={
                            thumbnailPreview &&
                            typeof thumbnailPreview === "string" &&
                            !thumbnailPreview.includes("data:") &&
                            !thumbnailPreview.includes("http")
                              ? `${Fetch_URL}${thumbnailPreview}`
                              : thumbnailPreview || "/placeholder.svg"
                          }
                          alt="Thumbnail preview"
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute w-6 h-6 rounded-full top-2 right-2"
                          onClick={() => setThumbnailPreview(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Gallery Images</label>
                  <div className="p-4 space-y-4 border rounded-lg">
                    <div
                      className="flex flex-col items-center justify-center p-6 transition-colors border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => editGalleryInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload gallery images
                      </p>
                      <input
                        ref={editGalleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleGalleryChange}
                      />
                    </div>

                    {galleryPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {galleryPreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="relative overflow-hidden rounded-lg aspect-square"
                          >
                            <img
                              src={
                                preview &&
                                typeof preview === "string" &&
                                !preview.includes("data:") &&
                                !preview.includes("http")
                                  ? `${Fetch_URL}${preview}`
                                  : preview || "/placeholder.svg"
                              }
                              alt={`Gallery image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute w-5 h-5 rounded-full top-1 right-1"
                              onClick={() => removeGalleryPreview(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Textarea
                  id="edit-description"
                  name="edit-description"
                  defaultValue={editingEvent.description}
                  rows={5}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
