// Leads to the endpoint https://l0gcat0mbb.execute-api.us-east-2.amazonaws.com/dev/say?keyword=Hello on AWS Lambda 
export async function handler(event) {
    const keyword = event.queryStringParameters?.keyword;
    const responseMessage = `Aminah says ${keyword}`;

    return {
        statusCode: 200,
        body: JSON.stringify({ message: responseMessage }),
    };
}
