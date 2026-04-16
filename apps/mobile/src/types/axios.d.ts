// Module augmentation so our private interceptor flags are typed.
import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** When true, the request bypasses the bearer-token attach + 401 refresh interceptors. */
    _skipAuth?: boolean;
    /** Internal: marks a request that has already been retried after a refresh, to prevent loops. */
    _retry?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    _skipAuth?: boolean;
    _retry?: boolean;
  }
}
