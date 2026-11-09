"use client"

import { useQuery } from "@tanstack/react-query"
import {
  rolesApi,
  serviceCategoriesApi,
  servicesApi,
  sessionsApi,
  staffApi,
} from "@/composition/services"

export function useRolesPage(
  params: NonNullable<Parameters<typeof rolesApi.adminList>[0]>,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["roles", "page", params],
    queryFn: ({ signal }) => rolesApi.adminList(params, signal),
    enabled,
  })
}

export function useCategoriesPage(
  params: NonNullable<Parameters<typeof serviceCategoriesApi.adminList>[0]>,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["categories", "page", params],
    queryFn: ({ signal }) => serviceCategoriesApi.adminList(params, signal),
    enabled,
  })
}

export function useServicesPage(
  params: NonNullable<Parameters<typeof servicesApi.list>[0]>,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["services", "page", params],
    queryFn: ({ signal }) => servicesApi.list(params, signal),
    enabled,
  })
}

export function useSessionsPage(
  params: NonNullable<Parameters<typeof sessionsApi.list>[0]>,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["sessions", "page", params],
    queryFn: ({ signal }) => sessionsApi.list(params, signal),
    enabled,
  })
}

export function useStaffPage(
  params: NonNullable<Parameters<typeof staffApi.list>[0]>,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["personel", "page", params],
    queryFn: ({ signal }) => staffApi.list(params, signal),
    enabled,
  })
}

export function useCategoryOptions() {
  return useQuery({
    queryKey: ["categories", "options"],
    queryFn: ({ signal }) => serviceCategoriesApi.list(undefined, signal),
  })
}

export function useRoleOptions() {
  return useQuery({
    queryKey: ["roles", "options"],
    queryFn: ({ signal }) => rolesApi.list(signal),
  })
}

export function useServiceCounts(params: NonNullable<Parameters<typeof servicesApi.counts>[0]>) {
  return useQuery({
    queryKey: ["services", "counts", params],
    queryFn: ({ signal }) => servicesApi.counts(params, signal),
  })
}

export function useSessionDebts(params: NonNullable<Parameters<typeof sessionsApi.debts>[0]>) {
  return useQuery({
    queryKey: ["sessions", "debts", params],
    queryFn: ({ signal }) => sessionsApi.debts(params, signal),
  })
}
