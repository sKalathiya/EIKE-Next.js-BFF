import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL

export async function DELETE(request: NextRequest) {
    try{
        const token = request.cookies.get("auth_token")?.value;

        if( !token ){
            return NextResponse.json({message: "Unauthorized session "}, {status:  401})
        }

        const nestResponse = await fetch(`${GATEWAY_URL}/api/v1/user`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })

        const data = await nestResponse.json();
        if(!nestResponse.ok){
            return NextResponse.json(data, { status: nestResponse.status });
        }
        const response = NextResponse.json(data, { status: nestResponse.status });
        response.cookies.set("auth_token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 0,
            path: "/",
            sameSite: "lax",
        });
        return response;
    }
    catch(error: any){
        return NextResponse.json(
            {message: error.response?.data?.message || 'Failed to delete user.'},
            {status : error.response?.status || 500}
        )
    }
}