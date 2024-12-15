import axios from 'axios';

import dotenv from 'dotenv';
import { parse } from 'node-html-parser';

dotenv.config();

console.log('Hello,, ');

const init = async () => {
    try {
        // make a request to an html page, then get the post action url
        axios.defaults.beforeRedirect = (options: any) => {
            if (options.headers?.cookie) {
                options.headers.cookie = [...options.headers.cookie, axios.defaults.headers.cookie].join(';');
            }
            console.log('Redirecting with options:', options.headers.cookie);
            return options;
        }

        axios.defaults.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

        axios.defaults.withCredentials = true;
        const urlParams = new URLSearchParams({
            'client_id': 'cartwheel-frontend', 
            'scope': 'openid email profile',
            'response_type': 'code',
            'redirect_uri': 'https://cloud.stc.com.sa/api/auth/callback/keycloak'
        })
        
        const response = await axios.get('https://connect.bluvalt.com/auth/realms/cartwheel/protocol/openid-connect/auth', {
            params: urlParams
        });
        
        //same as old cookies and the new response cookies
        axios.defaults.headers.cookie = [...response.headers['set-cookie'] || [], axios.defaults.headers.cookie].join(';');
        const body = response.data;
        const root = parse(body);
        const formAction = root.querySelector('form')?.getAttribute('action') || '';
        const decodedAction = decodeURIComponent(formAction.replace(/&amp;/g, '&'));


        console.log('Extracted action URL:', formAction);
        console.log('Decoded action URL:', decodedAction);


        // post to that action url with username and password from env as body of the post request

        const payload = {
            username: process.env.STC_USERNAME || '',
            password: process.env.STC_PASSWORD || '',
            credentialId: '',
        }

        const options = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }

        const loginResponse = await axios.post(decodedAction, payload, options);

        console.log('Login response:', loginResponse.headers);
        console.log('Last request URL:', loginResponse.request.res.responseUrl);

        // get the content of the page between <script id="__NEXT_DATA__" type="application/json"> and </script> and parse it as json
        const loginRoot = parse(loginResponse.data);
        const nextData = loginRoot.querySelector('#__NEXT_DATA__')?.innerHTML || '';
        const json = JSON.parse(nextData);
        const accessToken = JSON.stringify(json);
        
        console.log('Access token:', accessToken);
        //print the last request url after all redirects
        

    } catch (error) {
        console.error('Error during POST request:', error);
    }

}

init();