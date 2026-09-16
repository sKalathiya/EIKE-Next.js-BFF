import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL
export async function POST(request: NextRequest) {
    try{
        const token = request.cookies.get("auth_token")?.value;

        if( !token ){
            return NextResponse.json({message: "Unauthorized session "}, {status:  401})
        }

        const id = request.nextUrl.searchParams.get("id");
        if( !id ){
            return NextResponse.json({message: "Document ID is required"}, {status:  400})
        }

        const nestResponse = await fetch(`${GATEWAY_URL}/api/v1/document/retry/${id}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })

        const data = await nestResponse.json();
        if(!nestResponse.ok){
            return NextResponse.json(data, { status: nestResponse.status });
        }
        return NextResponse.json(data, { status: nestResponse.status });
    }
    catch(error: any){
        return NextResponse.json(
            {message: error.response?.data?.message || 'Failed to retry document.'},
            {status : error.response?.status || 500}
        )
    }
}