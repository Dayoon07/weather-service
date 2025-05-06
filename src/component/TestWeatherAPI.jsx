import { useState } from "react";

export default function TestWeatherAPI() {
    const [apiResponse, setApiResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [params, setParams] = useState({
        baseDate: getToday(),
        baseTime: "0500",
        nx: 60,
        ny: 127
    });

    // 오늘 날짜 포맷팅 (YYYYMMDD)
    function getToday() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 입력값 변경 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setParams(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // API 테스트 실행
    const testAPI = async () => {
        setLoading(true);
        setError(null);
        setApiResponse(null);
        
        // https://www.data.go.kr/data/15084084/openapi.do
        const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`;
        console.log(process.env.REACT_APP_WEATHER_API_KEY);
        
        const urlParams = new URLSearchParams({
            serviceKey: process.env.REACT_APP_WEATHER_API_KEY,
            pageNo: 1,
            numOfRows: 50, // 테스트용으로 적은 수만 요청
            dataType: "JSON",
            base_date: params.baseDate,
            base_time: params.baseTime,
            nx: params.nx,
            ny: params.ny
        });

        try {
            console.log(`API 요청 URL: ${url}?${urlParams}`);
            
            const response = await fetch(`${url}?${urlParams}`);
            const responseData = await response.json();
            
            setApiResponse(responseData);
            
            // 응답 구조 체크
            if (responseData.response && 
                responseData.response.header && 
                responseData.response.header.resultCode !== "00") {
                setError(`API 오류: ${responseData.response.header.resultMsg}`);
            }
        } catch (err) {
            console.error("API 호출 오류:", err);
            setError(`API 호출 중 오류 발생: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
            <h2>기상청 API 테스트 도구</h2>
            
            <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>날짜 (YYYYMMDD):</label>
                    <input 
                        type="text" 
                        name="baseDate" 
                        value={params.baseDate} 
                        onChange={handleInputChange}
                        style={{ padding: "8px", width: "200px" }}
                    />
                </div>
                
                <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>발표시각 (예: 0500, 0800):</label>
                    <input 
                        type="text" 
                        name="baseTime" 
                        value={params.baseTime} 
                        onChange={handleInputChange}
                        style={{ padding: "8px", width: "200px" }}
                    />
                </div>
                
                <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>X 좌표 (nx):</label>
                    <input 
                        type="number" 
                        name="nx" 
                        value={params.nx} 
                        onChange={handleInputChange}
                        style={{ padding: "8px", width: "200px" }}
                    />
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Y 좌표 (ny):</label>
                    <input 
                        type="number" 
                        name="ny" 
                        value={params.ny} 
                        onChange={handleInputChange}
                        style={{ padding: "8px", width: "200px" }}
                    />
                </div>
                
                <button 
                    onClick={testAPI}
                    disabled={loading}
                    style={{ 
                        padding: "10px 20px", 
                        backgroundColor: loading ? "#cccccc" : "#4a90e2", 
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer"
                    }}
                >
                    {loading ? "요청 중..." : "API 테스트"}
                </button>
            </div>
            
            {error && (
                <div style={{ padding: "15px", backgroundColor: "#ffebee", color: "#d32f2f", borderRadius: "8px", marginBottom: "20px" }}>
                    <strong>오류:</strong> {error}
                </div>
            )}
            
            {loading && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                    데이터를 불러오는 중...
                </div>
            )}
            
            {apiResponse && (
                <div>
                    <h3>API 응답 결과:</h3>
                    <div style={{ 
                        border: "1px solid #ddd", 
                        borderRadius: "8px", 
                        padding: "15px",
                        backgroundColor: "#f9f9f9",
                        maxHeight: "500px",
                        overflow: "auto"
                    }}>
                        <h4>응답 헤더:</h4>
                        {apiResponse.response && apiResponse.response.header ? (
                            <pre>{JSON.stringify(apiResponse.response.header, null, 2)}</pre>
                        ) : (
                            <p>헤더 정보 없음</p>
                        )}
                        
                        <h4>데이터 구조:</h4>
                        <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}