import { demoRequest, DemoError } from "@/infrastructure/demo/backend"
import type { AuthScope } from "@/domain/models/auth"

import { ApiError } from "@/application/errors/api-error"

export async function request<T>(
  path: string,
  init?: RequestInit & { signal?: AbortSignal; authScope?: AuthScope | null },
): Promise<T> {
  try {
    return (await demoRequest(path, init)) as T
  } catch (error) {
    if (error instanceof DemoError) throw new ApiError(error.status, error.message)
    throw error
  }
}
