# weather-service

![](https://dayoon07.github.io/weather-service/img/test.png)

공공 데이터 포털에서 발급받은 기상청_단기예보 ((구)_동네예보) 조회서비스 API키와 React로 만든 기상청 날씨 정보 웹 사이트입니다. 기상청이 지원하지 않는 새벽 12~3시는 지원을 안 하기 날씨 데이터를 불러오지 못 할 수도 있습니다.

## 기능
```js
async function fetchWeather() {
    setLoading(true);
    setError(null); // 에러 상태 초기화
    const baseDate = formatDate(0); // API 요청은 항상 오늘 기준
    const baseTime = formatTime();
    
    console.log(`API 요청 정보: 날짜=${baseDate}, 시간=${baseTime}, nx=${location.nx}, ny=${location.ny}, 선택된 날짜 오프셋=${selectedDate}`);

    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`;
    const params = new URLSearchParams({
        serviceKey: "API_KEY",
        pageNo: 1,
        numOfRows: 1000, 
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
        
        if (data && data.response && data.response.body && 
            data.response.body.items && data.response.body.items.item) {
            const items = data.response.body.items.item;
            setWeatherData(items);
            
            // 데이터 가공 함수
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
```

이렇게만 보면 구조가 어떻게 되어 있는지 이해가 잘 안되기 때문에 밑에 있는 거를 보면 api키에서 출력되는 데이터를 이해하기 쉬움

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE"
    },
    "body": {
      "dataType": "JSON",
      "items": {
        "item": [
          {
            "baseDate": "20250517",
            "baseTime": "0800",
            "category": "TMP",
            "fcstDate": "20250517",
            "fcstTime": "0900",
            "fcstValue": "19",
            "nx": 60,
            "ny": 127
          },
          {
            "baseDate": "20250517",
            "baseTime": "0800",
            "category": "UUU",
            "fcstDate": "20250517",
            "fcstTime": "0900",
            "fcstValue": "-1",
            "nx": 60,
            "ny": 127
          },
          ...
```

여기서 body 안에만 있는 거만 보면 됨. 실제 코드에서 검사할 때는 <br />
data.response.body.items.item.baseDate

## 레포 복사
1. 레포지토리 클론
    ```bash
    git clone https://github.com/Dayoon07/weather-service.git
    ```
2. Visual Studio Code에서 클론한 레포 열고
    ```bash
    npm install # node.js 설치되어 있어야 함
    npm start
    ```

## 사용 기술
HTML, CSS, JavaScript