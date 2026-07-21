import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, postAtuarComo } from "../services/atuar-como.service";

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
  });
}

export function useAtuarComo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contribuinteId: string) => postAtuarComo(contribuinteId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
      await qc.invalidateQueries({ queryKey: ["fiscal"] });
    },
  });
}
