/**
 * Standardized API response utilities
 * 
 * Provides consistent response formats across all API endpoints:
 * - successResponse: Returns success with optional data
 * - errorResponse: Returns error with message and status code
 * - unauthorizedResponse: Returns 401 unauthorized response
 */

/**
 * Creates a standardized success response
 * 
 * @param data - Optional data to include in response
 * @param status - HTTP status code (default: 200)
 * @returns Response with JSON body containing success and optional data
 * 
 * @example
 * return successResponse({ id: '123', name: 'Vendor' });
 * // Returns: { success: true, data: { id: '123', name: 'Vendor' } }
 * 
 * @example
 * return successResponse(null);
 * // Returns: { success: true }
 */
export function successResponse<T>(
  data?: T,
  status: number = 200
): Response {
  const body: { success: boolean; data?: T } = { success: true };
  if (data !== undefined && data !== null) {
    body.data = data;
  }
  
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Creates a standardized error response
 * 
 * @param message - Error message to return
 * @param status - HTTP status code (default: 400)
 * @returns Response with JSON body containing error message
 * 
 * @example
 * return errorResponse('Vendor ID is required', 400);
 * // Returns: { error: 'Vendor ID is required' } with status 400
 * 
 * @example
 * return errorResponse('Internal server error', 500);
 * // Returns: { error: 'Internal server error' } with status 500
 */
export function errorResponse(
  message: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Creates a standardized unauthorized response
 * 
 * @param message - Optional custom error message (default: 'Unauthorized')
 * @returns Response with JSON body containing error message and 401 status
 * 
 * @example
 * return unauthorizedResponse();
 * // Returns: { error: 'Unauthorized' } with status 401
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): Response {
  return errorResponse(message, 401);
}

