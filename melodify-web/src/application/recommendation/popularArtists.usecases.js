import { fetchPopularArtists } from "@/infrastructure/recommendation/popularArtists.api";

export const getPopularArtists =
  async (
    limit = 6,
  ) => {
    const response =
      await fetchPopularArtists(
        limit,
      );

    if (
      !Array.isArray(
        response?.data,
      )
    ) {
      return [];
    }

    return response.data;
  };