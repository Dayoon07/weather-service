import { useState, useEffect } from "react";
import "./WeatherService.css"; // 스타일시트 추가

export default function WeatherService() {
    const [weatherData, setWeatherData] = useState(null);
    const [processedData, setProcessedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState({ name: "서울특별시 중구 (시청)", nx: 60, ny: 127 });
    const [selectedDate, setSelectedDate] = useState(0); // 오늘부터 +0, +1, +2일

    // 날짜 포맷팅 함수
    const formatDate = (dateOffset = 0) => {
        const today = new Date();
        today.setDate(today.getDate() + dateOffset);
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    // 시간 포맷팅 함수
    const formatTime = () => {
        const now = new Date();
        // 기상청 API가 지원하는 발표시각: 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300
        const availableTimes = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"];
        const hour = now.getHours();
        
        // 현재 시간보다 이전의 가장 최근 발표시각 찾기
        for (let i = availableTimes.length - 1; i >= 0; i--) {
            if (parseInt(availableTimes[i].substring(0, 2)) <= hour) {
                return availableTimes[i];
            }
        }
        // 당일 첫 발표시각보다 이른 시간이면 마지막 발표시각 반환
        return availableTimes[availableTimes.length - 1];
    };

    // 기상 카테고리 이름 변환
    const getCategoryName = (category) => {
        const categories = {
            POP: "강수확률",
            PTY: "강수형태",
            REH: "습도",
            SKY: "하늘상태",
            TMP: "기온",
            TMN: "최저기온",
            TMX: "최고기온",
            UUU: "동서바람성분",
            VVV: "남북바람성분",
            WAV: "파고",
            VEC: "풍향",
            WSD: "풍속"
        };
        return categories[category] || category;
    };

    // 날씨 상태 해석 함수
    const interpretWeather = (category, value) => {
        if (category === "SKY") {
            if (value === "1") return "맑음";
            if (value === "3") return "구름많음";
            if (value === "4") return "흐림";
        }
        if (category === "PTY") {
            if (value === "0") return "없음";
            if (value === "1") return "비";
            if (value === "2") return "비/눈";
            if (value === "3") return "눈";
            if (value === "4") return "소나기";
        }
        return value;
    };

    // 날씨 아이콘 선택 함수
    const getWeatherIcon = (sky, pty) => {
        if (pty !== "0") {
            if (pty === "1" || pty === "4") return "🌧️";
            if (pty === "2") return "🌨️";
            if (pty === "3") return "❄️";
        } else {
            if (sky === "1") return "☀️";
            if (sky === "3") return "⛅";
            if (sky === "4") return "☁️";
        }
        return "🌈";
    };

    useEffect(() => {
        async function fetchWeather() {
            setLoading(true);
            setError(null); // 에러 상태 초기화
            const baseDate = formatDate(0); // API 요청은 항상 오늘 기준
            const baseTime = formatTime();
            
            console.log(`API 요청 정보: 날짜=${baseDate}, 시간=${baseTime}, nx=${location.nx}, ny=${location.ny}, 선택된 날짜 오프셋=${selectedDate}`);

            // https://www.data.go.kr/data/15084084/openapi.do
            const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`;
            const params = new URLSearchParams({
                serviceKey: process.env.REACT_APP_WEATHER_API_KEY,
                pageNo: 1,
                numOfRows: 1000, // 더 많은 데이터 요청 (내일, 모레 데이터 포함)
                dataType: "JSON",
                base_date: baseDate,
                base_time: baseTime,
                nx: location.nx,
                ny: location.ny
            });

            try {
                const response = await fetch(`${url}?${params}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP 오류: ${response.status}`);
                }
                
                const data = await response.json();
                
                // API 응답 구조 확인 및 오류 처리
                if (data && data.response && data.response.body && 
                    data.response.body.items && data.response.body.items.item) {
                    const items = data.response.body.items.item;
                    setWeatherData(items);
                    
                    // 데이터 가공
                    processWeatherData(items);
                } else {
                    console.error("API 응답 구조가 예상과 다릅니다:", data);
                    setError("날씨 데이터 형식이 올바르지 않습니다.");
                }
            } catch (err) {
                console.error(err);
                setError("날씨 데이터를 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        }

        fetchWeather();
    }, [location, selectedDate]);

    // 날씨 데이터 가공
    const processWeatherData = (items) => {
        if (!items || !items.length) {
            setProcessedData([]);
            return;
        }
    
        // 선택된 날짜에 해당하는 데이터만 필터링
        const targetDate = formatDate(selectedDate);
        const filteredItems = items.filter(item => item.fcstDate === targetDate);
        
        if (filteredItems.length === 0) {
            console.log(`${targetDate}에 해당하는 날씨 데이터가 없습니다.`);
            setProcessedData([]);
            return;
        }
    
        // 날짜와 시간별로 그룹화
        const groupedData = {};
        
        filteredItems.forEach(item => {
            const key = `${item.fcstDate}-${item.fcstTime}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    date: item.fcstDate,
                    time: item.fcstTime,
                    items: {}
                };
            }
            groupedData[key].items[item.category] = item.fcstValue;
        });
    
        // 시간순으로 정렬된 배열로 변환
        const sortedData = Object.values(groupedData).sort((a, b) => {
            if (a.date === b.date) {
                return a.time.localeCompare(b.time);
            }
            return a.date.localeCompare(b.date);
        });
    
        setProcessedData(sortedData);
    };

    // 위치 데이터 정의 - 시/도/구 체계적으로 구성
    const locationData = [
        { group: "서울특별시", locations: [
            { name: "서울특별시 중구 (시청)", nx: 60, ny: 127 },
            { name: "서울특별시 강남구", nx: 61, ny: 126 },
            { name: "서울특별시 강동구", nx: 62, ny: 126 },
            { name: "서울특별시 강북구", nx: 61, ny: 128 },
            { name: "서울특별시 강서구", nx: 58, ny: 126 },
            { name: "서울특별시 관악구", nx: 59, ny: 125 },
            { name: "서울특별시 광진구", nx: 62, ny: 126 },
            { name: "서울특별시 노원구", nx: 61, ny: 129 },
            { name: "서울특별시 도봉구", nx: 61, ny: 129 },
            { name: "서울특별시 동대문구", nx: 61, ny: 127 },
            { name: "서울특별시 동작구", nx: 59, ny: 125 },
            { name: "서울특별시 마포구", nx: 59, ny: 127 },
            { name: "서울특별시 서대문구", nx: 59, ny: 127 },
            { name: "서울특별시 서초구", nx: 61, ny: 125 },
            { name: "서울특별시 성동구", nx: 61, ny: 127 },
            { name: "서울특별시 성북구", nx: 61, ny: 127 },
            { name: "서울특별시 송파구", nx: 62, ny: 126 },
            { name: "서울특별시 양천구", nx: 58, ny: 126 },
            { name: "서울특별시 영등포구", nx: 58, ny: 126 },
            { name: "서울특별시 용산구", nx: 60, ny: 126 },
            { name: "서울특별시 은평구", nx: 59, ny: 127 },
            { name: "서울특별시 종로구", nx: 60, ny: 127 },
            { name: "서울특별시 중랑구", nx: 62, ny: 128 }
        ]},
        { group: "부산광역시", locations: [
            { name: "부산광역시 중구", nx: 97, ny: 74 },
            { name: "부산광역시 서구", nx: 97, ny: 74 },
            { name: "부산광역시 동구", nx: 98, ny: 75 },
            { name: "부산광역시 영도구", nx: 98, ny: 74 },
            { name: "부산광역시 부산진구", nx: 97, ny: 75 },
            { name: "부산광역시 동래구", nx: 98, ny: 76 },
            { name: "부산광역시 남구", nx: 98, ny: 75 },
            { name: "부산광역시 북구", nx: 96, ny: 76 },
            { name: "부산광역시 해운대구", nx: 99, ny: 75 },
            { name: "부산광역시 사하구", nx: 96, ny: 74 },
            { name: "부산광역시 금정구", nx: 98, ny: 77 },
            { name: "부산광역시 강서구", nx: 96, ny: 76 },
            { name: "부산광역시 연제구", nx: 98, ny: 76 },
            { name: "부산광역시 수영구", nx: 99, ny: 75 },
            { name: "부산광역시 사상구", nx: 96, ny: 75 }
        ]},
        { group: "경기도", locations: [
            { name: "경기도 수원시", nx: 61, ny: 121 },
            { name: "경기도 성남시", nx: 63, ny: 124 },
            { name: "경기도 용인시", nx: 64, ny: 119 },
            { name: "경기도 안양시", nx: 59, ny: 123 },
            { name: "경기도 안산시", nx: 58, ny: 121 },
            { name: "경기도 고양시", nx: 57, ny: 128 },
            { name: "경기도 과천시", nx: 60, ny: 124 },
            { name: "경기도 광명시", nx: 58, ny: 125 },
            { name: "경기도 광주시", nx: 65, ny: 123 },
            { name: "경기도 구리시", nx: 62, ny: 127 },
            { name: "경기도 군포시", nx: 59, ny: 122 },
            { name: "경기도 김포시", nx: 55, ny: 128 },
            { name: "경기도 남양주시", nx: 64, ny: 128 },
            { name: "경기도 동두천시", nx: 61, ny: 134 },
            { name: "경기도 부천시", nx: 56, ny: 125 },
            { name: "경기도 시흥시", nx: 57, ny: 123 },
            { name: "경기도 안성시", nx: 65, ny: 115 },
            { name: "경기도 양주시", nx: 61, ny: 131 },
            { name: "경기도 양평군", nx: 69, ny: 125 },
            { name: "경기도 여주시", nx: 71, ny: 121 },
            { name: "경기도 연천군", nx: 61, ny: 138 },
            { name: "경기도 오산시", nx: 62, ny: 118 },
            { name: "경기도 의왕시", nx: 60, ny: 122 },
            { name: "경기도 의정부시", nx: 61, ny: 130 },
            { name: "경기도 이천시", nx: 68, ny: 121 },
            { name: "경기도 파주시", nx: 56, ny: 131 },
            { name: "경기도 평택시", nx: 62, ny: 114 },
            { name: "경기도 포천시", nx: 64, ny: 134 },
            { name: "경기도 하남시", nx: 64, ny: 126 },
            { name: "경기도 화성시", nx: 57, ny: 119 }
        ]},
        { group: "대구광역시", locations: [
            { name: "대구광역시 중구", nx: 89, ny: 90 },
            { name: "대구광역시 동구", nx: 90, ny: 91 },
            { name: "대구광역시 서구", nx: 88, ny: 90 },
            { name: "대구광역시 남구", nx: 89, ny: 90 },
            { name: "대구광역시 북구", nx: 89, ny: 91 },
            { name: "대구광역시 수성구", nx: 89, ny: 90 },
            { name: "대구광역시 달서구", nx: 88, ny: 90 },
            { name: "대구광역시 달성군", nx: 86, ny: 88 }
        ]},
        { group: "인천광역시", locations: [
            { name: "인천광역시 중구", nx: 55, ny: 124 },
            { name: "인천광역시 동구", nx: 55, ny: 124 },
            { name: "인천광역시 미추홀구", nx: 55, ny: 124 },
            { name: "인천광역시 연수구", nx: 55, ny: 123 },
            { name: "인천광역시 남동구", nx: 56, ny: 124 },
            { name: "인천광역시 부평구", nx: 55, ny: 125 },
            { name: "인천광역시 계양구", nx: 56, ny: 126 },
            { name: "인천광역시 서구", nx: 55, ny: 126 },
            { name: "인천광역시 강화군", nx: 51, ny: 130 }
        ]},
        { group: "제주특별자치도", locations: [
            { name: "제주특별자치도 제주시", nx: 53, ny: 38 },
            { name: "제주특별자치도 서귀포시", nx: 52, ny: 33 }
        ]}
    ];

    // 위치 선택 핸들러
    const handleLocationChange = (e) => {
        const selectedLocationName = e.target.value;
        
        // 선택된 위치 찾기
        for (const group of locationData) {
            const foundLocation = group.locations.find(loc => loc.name === selectedLocationName);
            if (foundLocation) {
                setLocation(foundLocation);
                break;
            }
        }
    };

    // 날짜 선택 핸들러
    const handleDateChange = (offset) => {
        setSelectedDate(offset);
    };

    // 날짜 포맷 변환 (YYYYMMDD -> YYYY.MM.DD)
    const formatDisplayDate = (dateString) => {
        if (!dateString) return "";
        return `${dateString.substring(0, 4)}.${dateString.substring(4, 6)}.${dateString.substring(6, 8)}`;
    };

    // 시간 포맷 변환 (HHMM -> HH:MM)
    const formatDisplayTime = (timeString) => {
        if (!timeString) return "";
        return `${timeString.substring(0, 2)}:${timeString.substring(2, 4)}`;
    };

    // 요일 가져오기 함수
    const getDayOfWeek = (dateString) => {
        if (!dateString) return "";
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1; // JS에서 월은 0부터 시작
        const day = parseInt(dateString.substring(6, 8));
        
        const date = new Date(year, month, day);
        const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
        return dayNames[date.getDay()];
    };

    // 날짜 표시 함수 (오늘/내일/모레 + 날짜)
    const getDisplayDate = (offset) => {
        const dateString = formatDate(offset);
        const dayOfWeek = getDayOfWeek(dateString);
        let prefix = "";
        
        if (offset === 0) prefix = "오늘";
        else if (offset === 1) prefix = "내일";
        else if (offset === 2) prefix = "모레";
        
        return `${prefix} (${formatDisplayDate(dateString)}, ${dayOfWeek})`;
    };

    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="weather-service">
            <h1>날씨 서비스</h1>
            
            <div className="controls">
                <div className="location-selector">
                    <label htmlFor="location">지역 선택:</label>
                    <select 
                        id="location" 
                        value={location.name}
                        onChange={handleLocationChange}
                    >
                        {locationData.map((group) => (
                            <optgroup label={group.group} key={group.group}>
                                {group.locations.map((loc) => (
                                    <option value={loc.name} key={loc.name}>
                                        {loc.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                
                <div className="date-selector">
                    <button 
                        className={selectedDate === 0 ? 'active' : ''} 
                        onClick={() => handleDateChange(0)}
                    >
                        오늘
                    </button>
                    <button 
                        className={selectedDate === 1 ? 'active' : ''} 
                        onClick={() => handleDateChange(1)}
                    >
                        내일
                    </button>
                    <button 
                        className={selectedDate === 2 ? 'active' : ''} 
                        onClick={() => handleDateChange(2)}
                    >
                        모레
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">날씨 정보를 불러오는 중...</div>
            ) : processedData && processedData.length > 0 ? (
                <div className="weather-container">
                    <h2>{location.name} 날씨 {getDisplayDate(selectedDate)}</h2>
                    
                    <div className="weather-cards">
                        {processedData.map((timeSlot, index) => {
                            const skyValue = timeSlot.items.SKY;
                            const ptyValue = timeSlot.items.PTY;
                            const tempValue = timeSlot.items.TMP;
                            const popValue = timeSlot.items.POP;
                            const rehValue = timeSlot.items.REH;
                            
                            // 필수 데이터가 없으면 카드를 표시하지 않음
                            if (!skyValue || !ptyValue || !tempValue) {
                                return null;
                            }
                            
                            return (
                                <div className="weather-card" key={index}>
                                    <div className="time">{formatDisplayTime(timeSlot.time)}</div>
                                    <div className="icon">{getWeatherIcon(skyValue, ptyValue)}</div>
                                    <div className="temp">{tempValue}°C</div>
                                    <div className="condition">{interpretWeather('SKY', skyValue)}</div>
                                    <div className="details">
                                        <div>강수확률: {popValue ? popValue : '0'}%</div>
                                        <div>습도: {rehValue ? rehValue : '0'}%</div>
                                    </div>
                                </div>
                            );
                        })}
                        {processedData.length === 0 && (
                            <div className="no-data">선택한 날짜의 날씨 데이터가 없습니다.</div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="no-data">
                    {selectedDate > 0 ? 
                        `${selectedDate === 1 ? '내일' : '모레'} 날씨 데이터가 아직 제공되지 않았습니다.` : 
                        '날씨 데이터가 없습니다.'}
                </div>
            )}
        </div>
    );
}