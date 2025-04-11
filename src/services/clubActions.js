"use client";

// Base URL for API requests
const API_BASE_URL = "https://stealthlearn.in/imm-admin/api"; // This is correct

export async function createClub(clubData) {
  try {
    const response = await fetch(`${API_BASE_URL}/index3.php?resource=clubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clubData),
    });
    return handleResponse(response);
  } catch (error) {
    throw new Error("Network error: " + error.message);
  }
}

export async function updateClub(clubData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/index3.php?resource=clubs&id=${clubData.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubData),
      }
    );
    return handleResponse(response);
  } catch (error) {
    throw new Error("Network error: " + error.message);
  }
}

export async function deleteClub(clubId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/index3.php?resource=clubs&id=${clubId}`,
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
