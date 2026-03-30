// Shared
import { ExternalServiceError, ValidationError } from '@/shared/errors';
import { FACEBOOK_PERMISSIONS } from '@/shared/constants/facebook';

// Types
import type {
  FacebookProviderConnectionInput,
  FacebookProviderPort,
  FacebookProviderPortConnectionResult
} from '../ports';
import type { FacebookPostMetricsDto } from '../contracts';

type FacebookOAuthTokenResponse = {
  access_token: string;
  expires_in?: number;
};

type FacebookPageListResponse = {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    expires_in?: number;
  }>;
};

type FacebookMeResponse = {
  id: string;
};

type FacebookMetricsResponse = {
  likes?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  insights?: {
    data?: Array<{
      name: string;
      values?: Array<{ value: number }>;
    }>;
  };
};

export class FacebookGraphProvider implements FacebookProviderPort {
  /**
   * Builds a Facebook OAuth URL for connecting a page.
   * @param {string} userId - the user ID to use as the state parameter
   * @returns {string} - the Facebook OAuth URL
   * @throws {ValidationError} - if the Facebook app configuration is missing
   */
  buildConnectUrl(userId: string): string {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

    if (!appId || !redirectUri) {
      throw new ValidationError('Facebook app configuration is missing');
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: FACEBOOK_PERMISSIONS.join(','),
      state: userId
    });

    return `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Connects a Facebook page to the user.
   *
   * @param {FacebookProviderConnectionInput} input - the connection input
   * @returns {Promise<FacebookProviderPortConnectionResult>} - a promise that resolves to the connection result
   * @throws {ValidationError} - if the Facebook app configuration is missing or if the Facebook page was not returned
   */
  async connectPage(
    input: FacebookProviderConnectionInput
  ): Promise<FacebookProviderPortConnectionResult> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      throw new ValidationError('Facebook app configuration is missing');
    }

    const shortLivedToken = await this.request<FacebookOAuthTokenResponse>(
      `https://graph.facebook.com/v23.0/oauth/access_token?${new URLSearchParams(
        {
          client_id: appId,
          redirect_uri: redirectUri,
          client_secret: appSecret,
          code: input.code
        }
      ).toString()}`
    );

    const longLivedToken = await this.request<FacebookOAuthTokenResponse>(
      `https://graph.facebook.com/v23.0/oauth/access_token?${new URLSearchParams(
        {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken.access_token
        }
      ).toString()}`
    );

    const me = await this.request<FacebookMeResponse>(
      `https://graph.facebook.com/v23.0/me?${new URLSearchParams({
        access_token: longLivedToken.access_token
      }).toString()}`
    );

    const pages = await this.request<FacebookPageListResponse>(
      `https://graph.facebook.com/v23.0/me/accounts?${new URLSearchParams({
        access_token: longLivedToken.access_token
      }).toString()}`
    );

    const selectedPage = input.pageId
      ? pages.data.find(p => p.id === input.pageId)
      : pages.data[0];

    if (!selectedPage) {
      throw new ValidationError(
        'No Facebook page was returned for the connected account'
      );
    }

    return {
      facebookUserId: me.id,
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      accessToken: selectedPage.access_token,
      tokenExpiresAt: longLivedToken.expires_in
        ? new Date(Date.now() + longLivedToken.expires_in * 1000)
        : null
    };
  }

  /**
   * Publishes a post to a Facebook page.
   * @param {Object} input - the input object with the page ID, access token, content, and media URL (optional)
   * @param {string} input.pageId - the Facebook page ID
   * @param {string} input.accessToken - the Facebook access token
   * @param {string} input.content - the post content
   * @param {string | null | undefined} input.mediaUrl - the media URL (optional)
   * @returns {Promise<{ facebookPostId: string }>} - a promise that resolves to an object with the Facebook post ID
   */
  async publishPagePost(input: {
    pageId: string;
    accessToken: string;
    content: string;
    mediaUrl?: string | null;
  }): Promise<{ facebookPostId: string }> {
    const params = new URLSearchParams({
      message: input.content,
      access_token: input.accessToken
    });

    if (input.mediaUrl) {
      params.append('url', input.mediaUrl);
    }

    const response = await this.request<{ id: string }>(
      `https://graph.facebook.com/v23.0/${input.pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      }
    );

    return { facebookPostId: response.id };
  }

  /**
   * Fetches the metrics for a Facebook post.
   * @param {Object} input - the input object with the access token and Facebook post ID
   * @param {string} input.accessToken - the Facebook access token
   * @param {string} input.facebookPostId - the Facebook post ID
   * @returns {Promise<FacebookPostMetricsDto>} - a promise that resolves to a Facebook post metrics DTO
   */
  async fetchPostMetrics(input: {
    accessToken: string;
    facebookPostId: string;
  }): Promise<FacebookPostMetricsDto> {
    const fields = [
      'likes.summary(true)',
      'comments.summary(true)',
      'insights.metric(post_impressions,post_engaged_users)'
    ].join(',');

    const response = await this.request<FacebookMetricsResponse>(
      `https://graph.facebook.com/v23.0/${input.facebookPostId}?${new URLSearchParams(
        {
          fields,
          access_token: input.accessToken
        }
      ).toString()}`
    );

    const reach =
      response.insights?.data?.find(d => d.name === 'post_impressions')
        ?.values?.[0]?.value ?? 0;
    const engagement =
      response.insights?.data?.find(d => d.name === 'post_engaged_users')
        ?.values?.[0]?.value ?? 0;

    return {
      likes: response.likes?.summary?.total_count || 0,
      comments: response.comments?.summary?.total_count || 0,
      reach,
      engagement
    };
  }

  /**
   * Makes a request to the Facebook API.
   * @param {string | URL} input - the input string or URL to make the request to
   * @param {RequestInit} [init] - the request initialization object
   * @returns {Promise<T>} - a promise that resolves to the response JSON object
   * @throws {ExternalServiceError} - if the response status is not 200
   */
  private async request<T>(
    input: string | URL,
    init?: RequestInit
  ): Promise<T> {
    const response = await fetch(input, init);

    if (!response.ok) {
      const errorText = await response.text();
      throw new ExternalServiceError(
        `Facebook API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return (await response.json()) as T;
  }
}
