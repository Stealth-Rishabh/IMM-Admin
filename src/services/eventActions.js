"use server";

// Remove TypeScript interface and type annotations
export async function createEvent(eventData) {
  // Simulate server processing time
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Validate the event data
  if (
    !eventData.title ||
    !eventData.date ||
    !eventData.category ||
    !eventData.description
  ) {
    throw new Error("Missing required fields");
  }

  // In a real application, you would save to a database here
  console.log("Event created:", eventData);

  // Return the created event
  return {
    success: true,
    event: eventData,
  };
}

export async function updateEvent(eventData) {
  // Simulate server processing time
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Validate the event data
  if (
    !eventData.id ||
    !eventData.title ||
    !eventData.date ||
    !eventData.category ||
    !eventData.description
  ) {
    throw new Error("Missing required fields");
  }

  // In a real application, you would update the database here
  console.log("Event updated:", eventData);

  // Return the updated event
  return {
    success: true,
    event: eventData,
  };
}

export async function deleteEvent(eventId) {
  // Simulate server processing time
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Validate the event ID
  if (!eventId) {
    throw new Error("Missing event ID");
  }

  // In a real application, you would delete from the database here
  console.log("Event deleted:", eventId);

  // Return success
  return {
    success: true,
  };
}
