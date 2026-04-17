import apiClient from "./axios";

export interface Holiday {
  id: number;
  name: string;
  holidayDate: string;
  description: string;
}

export async function getHolidays(): Promise<Holiday[]> {
  const response = await apiClient.get<Holiday[]>("/api/v1/holidays");
  return response.data;
}

export async function uploadHolidays(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<{ message: string }>("/api/v1/holidays/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}
