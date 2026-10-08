import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlanSlots } from "@/prep-kit/data/types";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"prep_profiles">;
export type MealPlan = Omit<Tables<"prep_meal_plans">, "slots"> & { slots: PlanSlots };

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const id = await uid();
      const { data, error } = await supabase.from("prep_profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (data) return data;
      const { data: created, error: e2 } = await supabase.from("prep_profiles").insert({ id }).select("*").single();
      if (e2) throw e2;
      return created;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const id = await uid();
      const { error } = await supabase.from("prep_profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prep_favorites").select("recipe_id");
      if (error) throw error;
      return new Set(data.map((d) => d.recipe_id));
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, on }: { id: string; on: boolean }) => {
      const user_id = await uid();
      const q = on
        ? supabase.from("prep_favorites").insert({ user_id, recipe_id: id })
        : supabase.from("prep_favorites").delete().eq("user_id", user_id).eq("recipe_id", id);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prep_meal_plans").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as MealPlan[];
    },
  });
}

export function useCurrentPlan() {
  const plans = usePlans();
  const current = plans.data?.find((p) => p.is_current) ?? null;
  return { ...plans, data: current };
}

export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { [K in keyof MealPlan]?: MealPlan[K] | undefined }) => {
      const user_id = await uid();
      if (p.is_current) {
        await supabase.from("prep_meal_plans").update({ is_current: false }).eq("user_id", user_id).eq("is_current", true).neq("id", p.id ?? "00000000-0000-0000-0000-000000000000");
      }
      const { id: _id, ...rest } = p;
      const row = Object.fromEntries(Object.entries({ ...rest, user_id }).filter(([, v]) => v !== undefined)) as never;
      if (p.id) {
        const { error } = await supabase.from("prep_meal_plans").update(row).eq("id", p.id);
        if (error) throw error;
        return p.id;
      }
      const { data, error } = await supabase.from("prep_meal_plans").insert(row).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prep_meal_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function usePantry() {
  return useQuery({
    queryKey: ["pantry"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prep_pantry_items").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function usePantryMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["pantry"] });
  const add = useMutation({
    mutationFn: async (names: string[]) => {
      const user_id = await uid();
      const rows = names.map((n) => n.trim()).filter(Boolean).map((name) => ({ user_id, name }));
      if (!rows.length) return;
      const { error } = await supabase.from("prep_pantry_items").upsert(rows, { onConflict: "user_id,name", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prep_pantry_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  return { add, remove };
}
