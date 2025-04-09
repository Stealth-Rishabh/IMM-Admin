"use client";

// Base URL for API requests
const API_BASE_URL = "https://stealthlearn.in/imm-admin/api"; // This is correct

export async function createEvent(eventData) {
  try {
    const response = await fetch(`${API_BASE_URL}/index2.php?resource=events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });
    return handleResponse(response);
  } catch (error) {
    throw new Error("Network error: " + error.message);
  }
}

export async function updateEvent(eventData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/index2.php?resource=events&id=${eventData.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );
    return handleResponse(response);
  } catch (error) {
    throw new Error("Network error: " + error.message);
  }
}

export async function deleteEvent(eventId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/index2.php?resource=events&id=${eventId}`,
      {
        method: "DELETE",
      }
    );
    return handleResponse(response);
  } catch (error) {
    throw new Error("Network error: " + error.message);
  }
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}
