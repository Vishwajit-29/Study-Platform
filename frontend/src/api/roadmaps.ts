import client from './client';
import type { ApiResponse, RoadmapRequest, RoadmapResponse, ContentResponse } from '../types';

export const roadmapApi = {
  create: (data: RoadmapRequest) =>
    client.post<ApiResponse<RoadmapResponse>>('/roadmaps', data),

  getAll: () =>
    client.get<ApiResponse<RoadmapResponse[]>>('/roadmaps'),

  getById: (id: string) =>
    client.get<ApiResponse<RoadmapResponse>>(`/roadmaps/${id}`),

  start: (id: string) =>
    client.post<ApiResponse<RoadmapResponse>>(`/roadmaps/${id}/start`),

  delete: (id: string) =>
    client.delete<ApiResponse<void>>(`/roadmaps/${id}`),

  generateContent: (topicId: string, contentType: string = 'THEORY') =>
    client.post<ApiResponse<ContentResponse>>(`/roadmaps/topics/${topicId}/generate-content?contentType=${contentType}`),
};
