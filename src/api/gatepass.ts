// src/api/gatepass.ts ── Gatepass Management API Wrappers
import apiClient from "./axios";
import type { GatepassResponse, GatepassApplyRequest, GatepassActionRequest } from "../types/gatepass";

export const applyGatepass = async (data: GatepassApplyRequest): Promise<GatepassResponse> => {
  const response = await apiClient.post<GatepassResponse>("/api/v1/gatepasses/apply", data);
  return response.data;
};

export const approveGatepass = async (id: number): Promise<GatepassResponse> => {
  const response = await apiClient.post<GatepassResponse>(`/api/v1/gatepasses/${id}/approve`);
  return response.data;
};

export const rejectGatepass = async (id: number, data: GatepassActionRequest): Promise<GatepassResponse> => {
  const response = await apiClient.post<GatepassResponse>(`/api/v1/gatepasses/${id}/reject`, data);
  return response.data;
};

export const cancelGatepass = async (id: number): Promise<GatepassResponse> => {
  const response = await apiClient.post<GatepassResponse>(`/api/v1/gatepasses/${id}/cancel`);
  return response.data;
};

export const markExit = async (id: number): Promise<GatepassResponse> => {
  const response = await apiClient.post<GatepassResponse>(`/api/v1/gatepasses/${id}/exit`);
  return response.data;
};

export const markEntry = async (id: number): Promise<GatepassResponse> => {
  const response = await apiClient.post<GatepassResponse>(`/api/v1/gatepasses/${id}/entry`);
  return response.data;
};

export const getMyGatepasses = async (): Promise<GatepassResponse[]> => {
  const response = await apiClient.get<GatepassResponse[]>("/api/v1/gatepasses/my");
  return response.data;
};

export const getPendingGatepasses = async (): Promise<GatepassResponse[]> => {
  const response = await apiClient.get<GatepassResponse[]>("/api/v1/gatepasses/pending");
  return response.data;
};
