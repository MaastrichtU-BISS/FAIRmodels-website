

export const API_BASE_URL = (import.meta.env.DEV) ? process.env.API_BASE_URL : 'https://api.fairmodels.org'

export const EXECUTOR_BASE_URL = process.env.EXECUTOR_BASE_URL ?? `${API_BASE_URL}/executor`;