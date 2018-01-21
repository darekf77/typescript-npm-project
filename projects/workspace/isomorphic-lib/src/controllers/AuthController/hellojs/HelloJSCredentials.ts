export interface HelloJSCredentials {
    authResponse: {
        state: string;
        access_token: string;
        expires_in: number;
        client_id: string;
        network: string;
        display: string;
        redirect_uri: string;
        scope: string;
        expires: number;
    }
    network: 'facebook' | 'google' | 'twitter';
    data: FacebookData;
}

export interface FacebookData {
	email: string;
	firstname: string;
	lastname: string;
	name: string;
	timezone: number;
	verified: boolean;
	id: string;
	picture: string;
	thumbnail: string;
}