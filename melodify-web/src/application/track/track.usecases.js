import {
  getTracksRequest,
  getTrackByIdRequest,
} from "@/infrastructure/track/track.api";

import {
  createTrack,
} from "@/domain/track/track.entity";

export const getTrackCatalog = async ({
  page = 1,
  limit = 20,
  search = "",
} = {}) => {
  const data = await getTracksRequest({
    page,
    limit,
    search,
  });

  return data.data
    .map(createTrack)
    .filter(Boolean);
};

export const getTrackDetails = async (
  trackId,
) => {
  const data =
    await getTrackByIdRequest(
      trackId,
    );

  return createTrack(
    data.data,
  );
};