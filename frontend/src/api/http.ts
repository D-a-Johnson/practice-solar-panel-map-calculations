export async function errorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return (
    body.detail ??
    body.non_field_errors?.[0] ??
    `Request failed (HTTP ${response.status})`
  );
}
