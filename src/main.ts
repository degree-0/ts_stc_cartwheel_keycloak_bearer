import ky, { Options } from 'ky';
import dotenv from 'dotenv';
dotenv.config();

console.log('Hello,, it is me youre looking for, I can see it in your eyes, I can see it in your smile, you are all I ever wanted and my arms are open wide, cause you know just what to say and you know just what to do, and I want to tell you so much, I love you');

const response_parser = async (response: Response) => {
    return `Status Code: ${response.status}, Headers: ${JSON.stringify(response.headers.get('set-cookie'))}, Body: ${JSON.stringify(response.body)}`;
}

const init = async () => {

    // simple get to https://cloud.stc.com.sa/api/auth/providers
    const providers_response = await ky('https://cloud.stc.com.sa/api/auth/providers');
    console.log('providers_response', await response_parser(providers_response));
    
    // simple get to https://cloud.stc.com.sa/api/auth/csrf
    const csrf_response = await ky('https://cloud.stc.com.sa/api/auth/csrf');
    console.log('csrf_response', await response_parser(csrf_response));

    // simple post to https://cloud.stc.com.sa/api/auth/signin/keycloak? with csrfToken + callbackUrl https://cloud.stc.com.sa json:true in the url
    const keycloak_payload = {
        'csrfToken': csrf_response.headers.get('x-csrf-token')?.toString() || '',
        'callbackUrl': 'https://cloud.stc.com.sa',
        'json': 'true'
    }

    const keycloak_options: Options = {
        method: 'post',
        searchParams: keycloak_payload
    }

    const keycloak_response = await ky('https://cloud.stc.com.sa/api/auth/signin/keycloak', keycloak_options);
    console.log('keycloak_response', await response_parser(keycloak_response));



    // mimic https://connect.bluvalt.com/auth/realms/cartwheel/protocol/openid-connect/auth?client_id=cartwheel-frontend&scope=openid%20email%20profile&response_type=code&redirect_uri=https://cloud.stc.com.sa/api/auth%2Fcallback%2Fkeycloak get request in ky with payload as a variable and grab the respons headers with teh response in separate
    // variables

    const payload = {
        client_id: 'cartwheel-frontend',
        scope: 'openid email profile',
        response_type: 'code',
        redirect_uri: 'https://cloud.stc.com.sa/api/auth/callback/keycloak'
    }

    const options: Options = {
        method: 'get',
        searchParams: payload
    }

    const response = await ky('https://connect.bluvalt.com/auth/realms/cartwheel/protocol/openid-connect/auth', options);
    console.log(response);
    console.log(response.headers);
    console.log(await response.body?.getReader().read());
    // get the headers response
    // now lets make use of the responses in the new request that looks like this
        
    const payload2 = {
        username: process.env.username || '',
        password: process.env.password || '',
        credentialId: ''
    }

    const urlpayload = {
        session_code: 'xxxxxxxxxxxxx',
        execution: 'xxxxxxxxxxxxxx',
        client_id: 'cartwheel-frontend',
        tab_id: 'xxxxxxxxxxxxx'

    }

    const options2: Options = {
        method: 'post',
        body: new URLSearchParams(payload2).toString(),
        searchParams: urlpayload
    }

    const response2 = await ky('https://connect.bluvalt.com/auth/realms/cartwheel/login-actions/authenticate', options2);

}

init();