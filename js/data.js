// CodeSnack - data.js (original script order preserved)

/* 글로벌 상태 */
        let currentLang = 'python';
        let currentQuizIndex = 0;
        let currentTutorialIndex = 0;
        let xp = 0;
        let streak = 0;
        let solvedQuizzesCount = 0;
        let isHintUsed = false;
        let currentUser = null;

        /* W3Schools 스타일 튜토리얼 데이터 */
        const tutorialData = {
    python: [
        {
            id: "py-intro",
            title: "1. Python 소개 및 출력문",
            badge: "기초 문법",
            body: `<p>Python은 단순하고 읽기 쉬운 문법을 가진 인기 높은 언어입니다.</p><p>화면에 메시지를 출력하려면 <code>print()</code> 함수를 사용합니다. 문자열은 큰따옴표나 작은따옴표로 감싸줍니다.</p>`,
            code: `# 파이썬 첫 번째 예제\nprint("Hello, CodeSnack!")\nprint(10 + 20)`
        },
        {
            id: "py-vars",
            title: "2. 변수와 자료형",
            badge: "변수 & 데이터",
            body: `<p>변수는 데이터를 저장하는 상자입니다. 파이썬에서는 변수 타입을 별도로 지정하지 않고 값을 바로 할당할 수 있습니다.</p>`,
            code: `# 변수 선언 및 출력\nname = "CodeSnack"\nage = 20\nis_active = True\n\nprint(f"이름: {name}, 나이: {age}")`
        },
        {
            id: "py-cond",
            title: "3. 조건문 (if / elif / else)",
            badge: "제어문",
            body: `<p>조건에 따라 프로그램의 실행 흐름을 제어합니다. 파이썬은 들여쓰기(Indentation)로 코드 블록을 구분하므로 공백을 정확히 맞춰야 합니다.</p>`,
            code: `score = 85\n\nif score >= 90:\n    print("A 학점")\nelif score >= 80:\n    print("B 학점")\nelse:\n    print("C 학점")`
        },
        {
            id: "py-loop",
            title: "4. 반복문 (for / while)",
            badge: "반복문",
            body: `<p>동일한 코드를 여러 번 반복 실행할 때 사용합니다. <code>range()</code> 함수와 함께 쓰면 특정 횟수만큼 쉽게 반복할 수 있습니다.</p>`,
            code: `# 1부터 5까지 반복 출력\nfor i in range(1, 6):\n    print(f"스낵 #{i} 번째 맛보기 🍪")`
        }
    ],
    javascript: [
        {
            id: "js-intro",
            title: "1. JavaScript 소개 & console.log",
            badge: "웹 프로그래밍",
            body: `<p>JavaScript는 웹 페이지를 대화형으로 만드는 핵심 프로그래밍 언어입니다.</p><p>개발자 콘솔에 출력할 때는 <code>console.log()</code>를 사용합니다.</p>`,
            code: `// 자바스크립트 콘솔 출력\nconsole.log("Hello JavaScript!");\nconsole.log(10 * 5);`
        },
        {
            id: "js-vars",
            title: "2. 변수 선언 (const / let)",
            badge: "변수",
            body: `<p>재할당이 필요 없는 변수는 <code>const</code>, 값이 바뀔 변수는 <code>let</code>을 사용합니다.</p>`,
            code: `const platformName = "CodeSnack";\nlet userScore = 100;\nuserScore += 50;\n\nconsole.log(platformName, "점수:", userScore);`
        },
        {
            id: "js-func",
            title: "3. 함수와 화살표 함수",
            badge: "함수",
            body: `<p>자바스크립트에서는 <code>function</code> 키워드나 화살표(<code>=></code>)를 사용하여 함수를 만듭니다.</p>`,
            code: `// 화살표 함수 예제\nconst add = (a, b) => a + b;\nconsole.log("결과:", add(5, 10));`
        },
        {
            id: "js-arr",
            title: "4. 배열과 반복문",
            badge: "배열",
            body: `<p>여러 데이터를 배열(Array)에 담고, <code>forEach</code>나 <code>for...of</code>로 쉽게 순회할 수 있습니다.</p>`,
            code: `const snacks = ["사과", "바나나", "쿠키"];\nsnacks.forEach(snack => {\n    console.log(snack + " 먹기!");\n});`
        }
    ],
    cpp: [
        {
            id: "cpp-intro",
            title: "1. C++ 시작하기 & std::cout",
            badge: "시스템 언어",
            body: `<p>C++은 입출력을 위해 <code>&lt;iostream&gt;</code> 헤더와 <code>std::cout</code> 스트림을 사용합니다.</p>`,
            code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello C++ CodeSnack!" << endl;\n    return 0;\n}`
        },
        {
            id: "cpp-vars",
            title: "2. 변수와 자료형",
            badge: "기초 문법",
            body: `<p>C++은 정적 타입 언어로, 변수를 선언할 때 자료형(int, double, string 등)을 명시해야 합니다.</p>`,
            code: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    int age = 20;\n    string name = "CodeSnack";\n    cout << name << "의 나이는 " << age << "살입니다." << endl;\n    return 0;\n}`
        },
        {
            id: "cpp-cond",
            title: "3. 조건문 (if-else)",
            badge: "제어문",
            body: `<p>조건에 따라 다른 코드를 실행하려면 <code>if</code>, <code>else if</code>, <code>else</code>를 사용합니다.</p>`,
            code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int score = 85;\n    if (score >= 90) cout << "A";\n    else if (score >= 80) cout << "B";\n    else cout << "C";\n    return 0;\n}`
        }
    ],
    java: [
        {
            id: "java-intro",
            title: "1. Java 클래스와 메인 메소드",
            badge: "객체지향 언어",
            body: `<p>Java의 모든 코드는 클래스 내부에서 작성되며, 실행 진입점은 <code>main</code> 메소드입니다.</p>`,
            code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java CodeSnack!");\n    }\n}`
        },
        {
            id: "java-vars",
            title: "2. 변수와 타입",
            badge: "변수",
            body: `<p>Java는 강타입 언어입니다. 정수는 <code>int</code>, 문자열은 대문자로 시작하는 <code>String</code>을 사용합니다.</p>`,
            code: `public class Main {\n    public static void main(String[] args) {\n        String name = "CodeSnack";\n        int version = 1;\n        System.out.println(name + " v" + version);\n    }\n}`
        },
        {
            id: "java-cond",
            title: "3. 제어문 (if)",
            badge: "제어문",
            body: `<p>조건에 따라 흐름을 제어할 때 <code>if</code> 문을 사용합니다. 괄호 안에 조건을 작성합니다.</p>`,
            code: `public class Main {\n    public static void main(String[] args) {\n        int xp = 150;\n        if (xp >= 100) {\n            System.out.println("레벨업!");\n        }\n    }\n}`
        }
    ],
    csharp: [
        {
            id: "csharp-intro",
            title: "1. C# Console.WriteLine",
            badge: ".NET 스택",
            body: `<p>C#에서는 <code>Console.WriteLine()</code>을 호출하여 메시지를 출력합니다.</p>`,
            code: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello C# CodeSnack!");\n    }\n}`
        },
        {
            id: "csharp-var",
            title: "2. 변수와 var 키워드",
            badge: "변수",
            body: `<p>C#에서는 명시적으로 타입을 적거나, <code>var</code> 키워드를 사용해 컴파일러가 타입을 추론하게 할 수 있습니다.</p>`,
            code: `using System;\n\nclass Program {\n    static void Main() {\n        var greeting = "Hello";\n        int year = 2024;\n        Console.WriteLine($"{greeting}, C# {year}!");\n    }\n}`
        },
        {
            id: "csharp-loop",
            title: "3. 반복문 (for)",
            badge: "반복문",
            body: `<p>특정 횟수만큼 코드를 반복하려면 <code>for</code> 문을 사용합니다.</p>`,
            code: `using System;\n\nclass Program {\n    static void Main() {\n        for (int i = 1; i <= 3; i++) {\n            Console.WriteLine($"반복 횟수: {i}");\n        }\n    }\n}`
        }
    ]
};

        /* 한국어 퀴즈 데이터베이스 */
        const quizData = {
    python: [
        {
            title: "1. 출력문과 변수 사용",
            desc: "콘솔에 메시지를 출력하기 위한 올바른 키워드를 선택하세요.",
            codePrefix: "message = \"Hello CodeSnack\"\n",
            codeSuffix: "(message)",
            options: ["print", "console.log", "System.out.println", "printf"],
            answer: "print",
            hint: "파이썬에서 화면에 텍스트를 출력할 때 사용하는 가장 기본적 함수는 'p'로 시작합니다.",
            fileName: "main.py"
        },
        {
            title: "2. 리스트(List) 생성",
            desc: "파이썬에서 리스트를 정의하는 올바른 구문을 선택하세요.",
            codePrefix: "snacks = ",
            codeSuffix: "[\"칩\", \"쿠키\", \"사과\"]",
            options: ["", "new", "array", "list"],
            answer: "",
            hint: "파이썬은 대괄호 []를 사용해 바로 리스트 선언이 가능하므로 별도의 키워드 선언이 필요 없습니다.",
            fileName: "lists.py"
        },
        {
            title: "3. 조건문 문법",
            desc: "조건 분기를 시작할 때 사용하는 키워드를 선택하세요.",
            codePrefix: "score = 90\n",
            codeSuffix: " score >= 80:\n    print(\"합격!\")",
            options: ["if", "when", "check", "where"],
            answer: "if",
            hint: "'만약 ~라면'을 뜻하는 영어 단어 2글자 키워드입니다.",
            fileName: "condition.py"
        }
    ],
    javascript: [
        {
            title: "1. 변수 선언 문법",
            desc: "재할당이 불가능한 상수 변수를 선언할 때 사용하는 키워드를 선택하세요.",
            codePrefix: "",
            codeSuffix: " appName = \"CodeSnack\";\nconsole.log(appName);",
            options: ["const", "var", "val", "let"],
            answer: "const",
            hint: "상수를 뜻하는 영어 단어 'Constant'의 약자입니다.",
            fileName: "app.js"
        },
        {
            title: "2. 화살표 함수",
            desc: "화살표 함수(Arrow Function)를 작성하기 위한 올바른 기호를 선택하세요.",
            codePrefix: "const add = (a, b) ",
            codeSuffix: " a + b;\nconsole.log(add(3, 5));",
            options: ["=>", "->", "==", ">>"],
            answer: "=>",
            hint: "이콜(=)과 닫는 꺾쇠(>)를 조합하여 화살표 모양을 만듭니다.",
            fileName: "math.js"
        },
        {
            title: "3. 콘솔 출력",
            desc: "자바스크립트에서 콘솔에 메시지를 출력할 때 사용하는 메소드는 무엇인가요?",
            codePrefix: "console.",
            codeSuffix: "(\"성공!\");",
            options: ["log", "print", "write", "out"],
            answer: "log",
            hint: "기록을 뜻하는 'l'로 시작하는 3글자 단어입니다.",
            fileName: "app.js"
        }
    ],
    cpp: [
        {
            title: "1. 표준 출력 스트림",
            desc: "C++에서 화면에 문자열을 출력할 때 사용되는 스트림 객체를 선택하세요.",
            codePrefix: "#include <iostream>\nusing namespace std;\n\nint main() {\n    ",
            codeSuffix: " << \"CodeSnack C++\";\n    return 0;\n}",
            options: ["cout", "cin", "printf", "System.out"],
            answer: "cout",
            hint: "Character Output의 줄임말로, 'c' + 'out'의 형태입니다.",
            fileName: "main.cpp"
        },
        {
            title: "2. 정수형 변수 선언",
            desc: "C++에서 정수(Integer) 데이터를 저장하는 변수를 선언하는 키워드는 무엇일까요?",
            codePrefix: "#include <iostream>\nusing namespace std;\n\nint main() {\n    ",
            codeSuffix: " score = 100;\n    return 0;\n}",
            options: ["int", "integer", "num", "float"],
            answer: "int",
            hint: "정수를 뜻하는 'Integer'의 앞 3글자입니다.",
            fileName: "main.cpp"
        },
        {
            title: "3. 줄바꿈 기호",
            desc: "C++에서 cout을 사용할 때 줄바꿈을 하기 위한 스트림 조작자를 선택하세요.",
            codePrefix: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello\" << ",
            codeSuffix: ";\n    return 0;\n}",
            options: ["endl", "newline", "\\n", "br"],
            answer: "endl",
            hint: "'end line'의 약자입니다.",
            fileName: "main.cpp"
        }
    ],
    java: [
        {
            title: "1. 메인 진입 메소드",
            desc: "Java 메인 메소드의 접근 제어자 키워드를 선택하세요.",
            codePrefix: "public class Main {\n    ",
            codeSuffix: " static void main(String[] args) {\n        System.out.println(\"Hello Java\");\n    }\n}",
            options: ["public", "private", "protected", "global"],
            answer: "public",
            hint: "어디서나 접근할 수 있도록 공개한다는 의미의 접근 제어자입니다.",
            fileName: "Main.java"
        },
        {
            title: "2. 문자열 선언",
            desc: "Java에서 문자열(String) 타입의 변수를 선언할 때 올바른 키워드를 선택하세요.",
            codePrefix: "public class Main {\n    public static void main(String[] args) {\n        ",
            codeSuffix: " name = \"CodeSnack\";\n    }\n}",
            options: ["String", "string", "char", "text"],
            answer: "String",
            hint: "Java에서 문자열 클래스는 대문자 'S'로 시작해야 합니다.",
            fileName: "Main.java"
        },
        {
            title: "3. 출력문",
            desc: "Java에서 콘솔에 줄바꿈을 포함하여 문자를 출력하는 메소드를 선택하세요.",
            codePrefix: "public class Main {\n    public static void main(String[] args) {\n        System.out.",
            codeSuffix: "(\"출력 완료\");\n    }\n}",
            options: ["println", "print", "write", "log"],
            answer: "println",
            hint: "print 뒤에 line을 뜻하는 'ln'이 붙습니다.",
            fileName: "Main.java"
        }
    ],
    csharp: [
        {
            title: "1. 콘솔 출력 클래스",
            desc: "C#에서 텍스트를 출력할 때 호출하는 클래스를 선택하세요.",
            codePrefix: "using System;\n\nclass Program {\n    static void Main() {\n        ",
            codeSuffix: ".WriteLine(\"CodeSnack C#\");\n    }\n}",
            options: ["Console", "System", "Debug", "Output"],
            answer: "Console",
            fileName: "Program.cs"
        },
        {
            title: "2. 변수 타입 추론",
            desc: "C#에서 컴파일러가 자동으로 타입을 추론하도록 할 때 사용하는 키워드를 선택하세요.",
            codePrefix: "using System;\n\nclass Program {\n    static void Main() {\n        ",
            codeSuffix: " message = \"Hello C#\";\n        Console.WriteLine(message);\n    }\n}",
            options: ["var", "auto", "let", "dynamic"],
            answer: "var",
            hint: "변수(Variable)의 약자입니다.",
            fileName: "Program.cs"
        },
        {
            title: "3. 반복문 시작 인덱스",
            desc: "C# 배열을 순회할 때 첫 번째 요소에 접근하기 위한 올바른 인덱스 번호를 선택하세요.",
            codePrefix: "using System;\n\nclass Program {\n    static void Main() {\n        string[] items = {\"A\", \"B\", \"C\"};\n        Console.WriteLine(items[",
            codeSuffix: "]); // \"A\" 출력\n    }\n}",
            options: ["0", "1", "first", "-1"],
            answer: "0",
            hint: "컴퓨터 과학에서 배열의 순서는 보통 0부터 시작합니다.",
            fileName: "Program.cs"
        }
    ]
};

        const langTips = {
            python: "Python은 가독성이 뛰어나고 들여쓰기(Indentation)가 구문 구조를 결정합니다.",
            javascript: "JavaScript는 웹 브라우저의 대표 프로그래밍 언어로 이벤트 기반 비동기 처리가 핵심입니다.",
            cpp: "C++은 하드웨어 성능 중심의 언어로 메모리와 포인터 개념 이해에 좋습니다.",
            java: "Java는 강력한 객체지향 언어로 JVM 위에서 안정적으로 동작합니다.",
            csharp: "C#은 Microsoft .NET 생태계와 Unity 게임 개발의 표준 언어입니다."
        };

        const templateData = {
            python: [
                { 
                    title: "별 찍기 (직각삼각형)", 
                    desc: "반복문(for)을 활용한 기본적인 직각삼각형 별 찍기 예제입니다.", 
                    tag: "기초 문법",
                    code: "n = 5\nfor i in range(1, n + 1):\n    print('*' * i)"
                },
                { 
                    title: "구구단 출력기", 
                    desc: "특정 단수(Dan)를 지정하여 구구단을 깔끔하게 출력하는 예제입니다.", 
                    tag: "기초 문법",
                    code: "dan = 3\nprint(f'=== {dan}단 ===')\nfor i in range(1, 10):\n    print(f'{dan} x {i} = {dan * i}')"
                },
                { 
                    title: "웹 API 응답 만들기 (설치 없이 실행)",
                    desc: "HTTP 경로 처리와 JSON 응답을 Python 표준 라이브러리로 연습합니다. 별도 Flask 설치나 서버 실행이 필요 없어요.",
                    tag: "웹 / JSON",
                    code: "import json\n\ndef handle_request(method, path):\n    # 웹 API의 요청 경로와 HTTP 메서드를 확인합니다.\n    if method == \"GET\" and path == \"/api/snack\":\n        return 200, {\"message\": \"Hello CodeSnack API!\", \"status\": 200}\n    return 404, {\"error\": \"Not found\"}\n\nstatus, body = handle_request(\"GET\", \"/api/snack\")\nprint(f\"HTTP 상태: {status}\")\nprint(json.dumps(body, ensure_ascii=False, indent=2))"

                }
,
                {"title": "장바구니 금액·할인 계산", "desc": "상품 합계와 쿠폰 할인, 배송비까지 계산하는 주문 예제", "tag": "쇼핑 / 계산", "code": "items = {'노트': 4500, '펜': 1200, '파일': 3000}\ntotal = sum(items.values())\ndiscount = int(total * 0.1) if total >= 8000 else 0\nshipping = 0 if total >= 30000 else 2500\nprint('상품:', ', '.join(items))\nprint(f'결제 금액: {total - discount + shipping:,}원')\n"},
                {"title": "가계부 월별 합계", "desc": "거래 내역을 카테고리별로 묶어 가장 큰 지출 찾기", "tag": "데이터 / 가계부", "code": "from collections import defaultdict\ntransactions = [('식비', 8500), ('교통', 1450), ('식비', 6200), ('문화', 12000)]\ntotals = defaultdict(int)\nfor category, amount in transactions:\n    totals[category] += amount\nfor category, amount in sorted(totals.items()):\n    print(f'{category}: {amount:,}원')\nprint('가장 큰 지출:', max(totals, key=totals.get))\n"},
                {"title": "재고 부족 알림", "desc": "매장의 재고 목록에서 최소 수량 이하 상품 추리기", "tag": "업무 자동화", "code": "stock = {'우유': 3, '빵': 12, '커피': 2, '주스': 8}\nthreshold = 4\nlow_stock = {name: qty for name, qty in stock.items() if qty <= threshold}\nfor name, qty in low_stock.items():\n    print(f'[발주 필요] {name}: {qty}개')\nprint('확인 상품:', len(stock), '개')\n"},
                {"title": "CSV 매출 리포트", "desc": "문자열 CSV를 읽고 품목별 총매출 집계하기 (표준 라이브러리)", "tag": "파일 / CSV", "code": "import csv, io\ndata = '상품,가격,수량\\n커피,3000,2\\n빵,2500,3\\n커피,3000,1\\n'\nrevenue = {}\nfor row in csv.DictReader(io.StringIO(data)):\n    name = row['상품']\n    revenue[name] = revenue.get(name, 0) + int(row['가격'])*int(row['수량'])\nfor name, amount in revenue.items():\n    print(f'{name}: {amount:,}원')\n"},
                {"title": "예약 시간 중복 검사", "desc": "예약 일정이 겹치는지 확인하는 간단한 예약 시스템", "tag": "서비스 / 예약", "code": "bookings = [(9, 10), (11, 12), (14, 16)]\ndef can_book(start, end):\n    return start < end and all(end <= a or start >= b for a,b in bookings)\nfor period in [(10,11), (11,13), (16,18)]:\n    print(f'{period[0]}~{period[1]}시:', '예약 가능' if can_book(*period) else '중복 예약')\n"},
                {"title": "쇼핑몰 상품 + 장바구니", "desc": "Product 클래스를 cart.py에서 불러와 상품 추가·총액 계산하기", "tag": "멀티파일 · 클래스", "files": [{"name": "main.py", "content": "from product import Product\nfrom cart import ShoppingCart\ncart = ShoppingCart()\ncart.add(Product('키보드', 35000), 1)\ncart.add(Product('마우스', 18000), 2)\nprint(cart.receipt())\n"}, {"name": "product.py", "content": "class Product:\n    def __init__(self, name, price):\n        self.name, self.price = name, price\n"}, {"name": "cart.py", "content": "from product import Product\nclass ShoppingCart:\n    def __init__(self):\n        self.items = []\n    def add(self, product: Product, qty: int):\n        self.items.append((product, qty))\n    def receipt(self):\n        rows = [f'{p.name} x{qty}: {p.price*qty:,}원' for p, qty in self.items]\n        return '\\n'.join(rows) + f'\\n합계: {sum(p.price*qty for p,qty in self.items):,}원'\n"}], "entry": "main.py"},
                {"title": "회원 모델 + 포인트 서비스", "desc": "User 클래스를 회원 서비스가 사용해 가입·포인트 적립 처리", "tag": "멀티파일 · 클래스", "files": [{"name": "main.py", "content": "from member import User\nfrom service import PointService\nuser = User('민수')\nservice = PointService()\nservice.earn(user, 100)\nservice.earn(user, 40)\nprint(user.summary())\n"}, {"name": "member.py", "content": "class User:\n    def __init__(self, name):\n        self.name, self.points = name, 0\n    def summary(self):\n        return f'{self.name}: {self.points} 포인트'\n"}, {"name": "service.py", "content": "from member import User\nclass PointService:\n    def earn(self, user: User, amount: int):\n        if amount <= 0: raise ValueError('포인트는 양수여야 합니다')\n        user.points += amount\n"}], "entry": "main.py"},
                {"title": "가계부 거래 + 리포트 서비스", "desc": "Transaction 데이터 클래스를 report.py가 집계하는 구조", "tag": "멀티파일 · 클래스", "files": [{"name": "main.py", "content": "from transaction import Transaction\nfrom report import SpendingReport\ndata = [Transaction('식비',8000), Transaction('교통',1500), Transaction('식비',9500)]\nprint(SpendingReport(data).summary())\n"}, {"name": "transaction.py", "content": "from dataclasses import dataclass\n@dataclass\nclass Transaction:\n    category: str\n    amount: int\n"}, {"name": "report.py", "content": "from collections import defaultdict\nclass SpendingReport:\n    def __init__(self, transactions):\n        self.transactions = transactions\n    def summary(self):\n        totals = defaultdict(int)\n        for t in self.transactions:\n            totals[t.category] += t.amount\n        return '\\n'.join(f'{k}: {v:,}원' for k,v in sorted(totals.items()))\n"}], "entry": "main.py"}
            ],
            javascript: [
                { 
                    title: "별 찍기 (직각삼각형)", 
                    desc: "for문과 문자열 repeat() 함수를 활용한 별 찍기 예제입니다.", 
                    tag: "기초 문법",
                    code: "const n = 5;\nfor (let i = 1; i <= n; i++) {\n    console.log('*'.repeat(i));\n}"
                },
                { 
                    title: "구구단 출력기", 
                    desc: "템플릿 리터럴(백틱)을 사용하여 구구단을 출력해보는 예제입니다.", 
                    tag: "기초 문법",
                    code: "const dan = 3;\nconsole.log(`=== ${dan}단 ===`);\nfor (let i = 1; i <= 9; i++) {\n    console.log(`${dan} x ${i} = ${dan * i}`);\n}"
                },
                { 
                    title: "Fetch API 비동기 래퍼",
                    desc: "외부 서비스에 연결하지 않고 Fetch와 async/await 요청·응답을 연습합니다.",
                    tag: "웹 / 비동기",
                    code: "async function fetchData(url) {\n    try {\n        const response = await fetch(url);\n        if (!response.ok) throw new Error(`HTTP ${response.status}`);\n        const data = await response.json();\n        console.log('데이터 수신 성공:', data);\n    } catch (error) {\n        console.error('요청 오류:', error.message);\n    }\n}\n\n// 외부 서버 없이도 Fetch와 async/await 흐름을 테스트할 수 있어요.\nconst sample = {id: 1, title: 'CodeSnack 연습', completed: true};\nconst sampleUrl = 'data:application/json,' + encodeURIComponent(JSON.stringify(sample));\nawait fetchData(sampleUrl);" 

                }
,
                {"title": "온라인 쇼핑몰 결제 계산", "desc": "할인 쿠폰과 배송비를 합산해 결제 금액 구하기", "tag": "쇼핑 / 계산", "code": "const cart = [{name:'노트',price:4500,qty:2},{name:'펜',price:1200,qty:3}];\nconst subtotal = cart.reduce((sum,item)=>sum+item.price*item.qty,0);\nconst discount = subtotal>=10000 ? Math.floor(subtotal*0.1) : 0;\nconst shipping = subtotal>=30000 ? 0 : 2500;\nconsole.log('상품 합계:', subtotal);\nconsole.log('할인:', discount);\nconsole.log('최종 금액:', subtotal-discount+shipping);\n"},
                {"title": "검색어 자동완성", "desc": "상품 이름 배열을 검색어로 필터링해 추천 목록 출력", "tag": "검색 / 필터", "code": "const products = ['딸기 우유','초코 우유','바나나 우유','딸기 잼','사과 주스'];\nfunction search(keyword){return products.filter(name=>name.includes(keyword));}\nconsole.log('우유 검색:', search('우유').join(', '));\nconsole.log('딸기 검색:', search('딸기').join(', '));\n"},
                {"title": "출석 기록 통계", "desc": "배열의 출석 상태를 집계해 출석률 출력", "tag": "학교 / 출석", "code": "const attendance = [{name:'지민',present:true},{name:'수아',present:true},{name:'준호',present:false}];\nconst present = attendance.filter(row=>row.present).length;\nconsole.log('출석:', present, '명');\nconsole.log('결석:', attendance.length-present, '명');\nconsole.log('출석률:', Math.round(present/attendance.length*100)+'%');\n"},
                {"title": "서버 응답 데이터 정리", "desc": "API 응답과 같은 JSON 데이터를 상태별로 묶기", "tag": "웹 / JSON", "code": "const response = JSON.stringify({orders:[{id:1,status:'완료'},{id:2,status:'대기'},{id:3,status:'완료'}]});\nconst {orders} = JSON.parse(response);\nconst counts = orders.reduce((acc,order)=>{acc[order.status]=(acc[order.status]||0)+1;return acc;},{});\nconsole.log(JSON.stringify(counts,null,2));\n"},
                {"title": "예약 시간 중복 방지", "desc": "새 예약이 기존 예약과 겹치는지 검사", "tag": "서비스 / 예약", "code": "const bookings = [{start:9,end:10},{start:11,end:13}];\nfunction available(start,end){return start<end && bookings.every(x=>end<=x.start || start>=x.end);}\n[[10,11],[12,14],[13,15]].forEach(([a,b])=>console.log(`${a}~${b}시:`,available(a,b)?'예약 가능':'시간 중복'));\n"},
                {"title": "쇼핑몰 Product + Cart", "desc": "CommonJS require/module.exports로 두 클래스를 파일 간 연결", "tag": "멀티파일 · 클래스", "files": [{"name": "app.js", "content": "const Product = require('./product.js');\nconst Cart = require('./cart.js');\nconst cart = new Cart();\ncart.add(new Product('키보드',35000),1);\ncart.add(new Product('마우스',18000),2);\nconsole.log(cart.receipt());\n"}, {"name": "product.js", "content": "class Product {constructor(name,price){this.name=name;this.price=price;}}\nmodule.exports = Product;\n"}, {"name": "cart.js", "content": "class Cart {\n    constructor(){this.items=[];}\n    add(product,quantity){this.items.push({product,quantity});}\n    receipt(){\n        const lines=this.items.map(({product:p,quantity:q})=>`${p.name} x${q}: ${p.price*q}원`);\n        return [...lines,`합계: ${this.items.reduce((s,{product:p,quantity:q})=>s+p.price*q,0)}원`].join('\\n');\n    }\n}\nmodule.exports = Cart;\n"}], "entry": "app.js"},
                {"title": "회원 User + 포인트 서비스", "desc": "파일별 사용자 모델, 비즈니스 로직을 나눠 관리하기", "tag": "멀티파일 · 클래스", "files": [{"name": "app.js", "content": "const User = require('./user.js');\nconst PointsService = require('./points.js');\nconst person = new User('하린');\nconst service = new PointsService();\nservice.earn(person,120);\nservice.earn(person,30);\nconsole.log(person.summary());\n"}, {"name": "user.js", "content": "class User {\n  constructor(name){this.name=name;this.points=0;}\n  summary(){return `${this.name}: ${this.points} 포인트`;}\n}\nmodule.exports = User;\n"}, {"name": "points.js", "content": "class PointsService {\n  earn(user,amount){if(amount<=0)throw Error('양수만 적립 가능');user.points+=amount;}\n}\nmodule.exports = PointsService;\n"}], "entry": "app.js"},
                {"title": "지출 Transaction + Report", "desc": "데이터 클래스를 다른 파일의 리포트 서비스가 집계", "tag": "멀티파일 · 클래스", "files": [{"name": "app.js", "content": "const Transaction = require('./transaction.js');\nconst Report = require('./report.js');\nconst rows=[new Transaction('식비',8000),new Transaction('교통',1500),new Transaction('식비',9500)];\nconsole.log(new Report(rows).summary());\n"}, {"name": "transaction.js", "content": "class Transaction {constructor(category,amount){this.category=category;this.amount=amount;}}\nmodule.exports = Transaction;\n"}, {"name": "report.js", "content": "class Report {\n  constructor(items){this.items=items;}\n  summary(){\n    const sums={};\n    for(const {category,amount} of this.items)sums[category]=(sums[category]||0)+amount;\n    return Object.entries(sums).map(([k,v])=>`${k}: ${v}원`).join('\\n');\n  }\n}\nmodule.exports = Report;\n"}], "entry": "app.js"}
            ],
            cpp: [
                { 
                    title: "별 찍기 (직각삼각형)", 
                    desc: "이중 for문을 활용한 전통적인 C++ 별 찍기 알고리즘입니다.", 
                    tag: "기초 문법",
                    code: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 5;\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= i; j++) {\n            cout << \"*\";\n        }\n        cout << \"\\n\";\n    }\n    return 0;\n}"
                },
                { 
                    title: "구구단 출력기", 
                    desc: "C++ 표준 입출력을 활용하여 구구단을 출력하는 예제입니다.", 
                    tag: "기초 문법",
                    code: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int dan = 3;\n    cout << \"=== \" << dan << \"단 ===\\n\";\n    for (int i = 1; i <= 9; i++) {\n        cout << dan << \" x \" << i << \" = \" << (dan * i) << \"\\n\";\n    }\n    return 0;\n}"
                }
,
                {"title": "쇼핑몰 금액·할인 계산", "desc": "상품 가격, 수량, 조건부 할인 계산", "tag": "쇼핑 / 계산", "code": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  vector<pair<int,int>> items={{4500,2},{1200,3}};\n  int subtotal=0;\n  for(auto [price,qty]:items) subtotal+=price*qty;\n  int discount=subtotal>=10000?subtotal/10:0;\n  cout << \"결제 금액: \" << subtotal-discount+2500 << \"원\\n\";\n}\n"},
                {"title": "학생 성적 평균·등급", "desc": "vector의 점수 데이터 평균과 등급 출력", "tag": "학교 / 자료구조", "code": "#include <iostream>\n#include <vector>\n#include <numeric>\nusing namespace std;\nint main(){\n  vector<int> scores={90,82,96,75};\n  double avg=(double)accumulate(scores.begin(),scores.end(),0)/scores.size();\n  cout << \"평균: \" << avg << \"점\\n\";\n  cout << \"등급: \" << (avg>=90?'A':avg>=80?'B':'C') << \"\\n\";\n}\n"},
                {"title": "재고 부족 알림", "desc": "map에 등록된 상품 재고의 최소 수량 검사", "tag": "업무 / 자료구조", "code": "#include <iostream>\n#include <map>\n#include <string>\nusing namespace std;\nint main(){\n  map<string,int> stock={{\"milk\",3},{\"bread\",12},{\"coffee\",2}};\n  for(const auto& [name,quantity]:stock)\n    if(quantity<=4)cout<<\"발주 필요: \"<<name<<\" (\"<<quantity<<\")\\n\";\n}\n"},
                {"title": "주차 요금 계산기", "desc": "시간 구간별 주차 요금을 함수로 계산", "tag": "서비스 / 요금", "code": "#include <iostream>\nusing namespace std;\nint parkingFee(int minutes){\n  if(minutes<=30)return 1000;\n  return 1000+((minutes-30+9)/10)*500;\n}\nint main(){for(int m:{20,45,90})cout<<m<<\"분: \"<<parkingFee(m)<<\"원\\n\";}\n"},
                {"title": "예약 시간 겹침 확인", "desc": "구조체와 vector로 예약 중복 검증", "tag": "서비스 / 예약", "code": "#include <iostream>\n#include <vector>\nusing namespace std;\nstruct Booking{int start,end;};\nbool available(const vector<Booking>& bookings,int s,int e){\n  if(s>=e)return false;\n  for(auto x:bookings)if(s<x.end && e>x.start)return false;\n  return true;\n}\nint main(){vector<Booking> list={{9,10},{11,13}};\n  cout<<(available(list,12,14)?\"예약 가능\":\"시간 중복\")<<\"\\n\";}\n"},
                {"title": "상품 Product + Cart (헤더 파일)", "desc": "Product.hpp와 Cart.hpp를 main.cpp에서 include하여 연결", "tag": "멀티파일 · 클래스", "files": [{"name": "main.cpp", "content": "#include <iostream>\n#include \"Cart.hpp\"\nint main(){Cart cart;cart.add(Product(\"Keyboard\",35000),1);cart.add(Product(\"Mouse\",18000),2);\n  std::cout << cart.receipt();}\n"}, {"name": "Product.hpp", "content": "#pragma once\n#include <string>\nstruct Product {\n  std::string name; int price;\n  Product(std::string n,int p):name(n),price(p){}\n};\n"}, {"name": "Cart.hpp", "content": "#pragma once\n#include \"Product.hpp\"\n#include <vector>\n#include <sstream>\nclass Cart {\n  std::vector<std::pair<Product,int>> items;\npublic:\n  void add(Product p,int qty){items.emplace_back(p,qty);}\n  std::string receipt()const{\n    std::ostringstream out;int total=0;\n    for(const auto& item:items){auto& p=item.first;int qty=item.second;\n      out<<p.name<<\" x\"<<qty<<\": \"<<p.price*qty<<\"원\\n\";total+=p.price*qty;}\n    out<<\"합계: \"<<total<<\"원\\n\";return out.str();\n  }\n};\n"}], "entry": "main.cpp"},
                {"title": "회원 User + PointService", "desc": "헤더에서 사용자 모델을 만들고 서비스가 포인트 적립 처리", "tag": "멀티파일 · 클래스", "files": [{"name": "main.cpp", "content": "#include <iostream>\n#include \"PointService.hpp\"\nint main(){User user(\"Minsoo\");PointService service;\n  service.earn(user,100);service.earn(user,40);\n  std::cout<<user.name<<\": \"<<user.points<<\" points\\n\";}\n"}, {"name": "User.hpp", "content": "#pragma once\n#include <string>\nstruct User {std::string name;int points=0;explicit User(std::string n):name(n){}};\n"}, {"name": "PointService.hpp", "content": "#pragma once\n#include \"User.hpp\"\n#include <stdexcept>\nclass PointService {\npublic:\n  void earn(User& user,int amount){if(amount<=0)throw std::invalid_argument(\"positive only\");user.points+=amount;}\n};\n"}], "entry": "main.cpp"},
                {"title": "거래 Transaction + Report", "desc": "struct 거래 데이터와 집계 클래스를 헤더별로 분리", "tag": "멀티파일 · 클래스", "files": [{"name": "main.cpp", "content": "#include <iostream>\n#include \"Report.hpp\"\nint main(){std::vector<Transaction> rows={{\"food\",8000},{\"bus\",1500},{\"food\",9500}};\n  Report report(rows);std::cout<<report.summary();}\n"}, {"name": "Transaction.hpp", "content": "#pragma once\n#include <string>\nstruct Transaction{std::string category;int amount;};\n"}, {"name": "Report.hpp", "content": "#pragma once\n#include \"Transaction.hpp\"\n#include <map>\n#include <vector>\n#include <sstream>\nclass Report {\n  std::vector<Transaction> rows;\npublic:\n  explicit Report(std::vector<Transaction> r):rows(r){}\n  std::string summary()const{\n    std::map<std::string,int> totals;\n    for(auto& row:rows)totals[row.category]+=row.amount;\n    std::ostringstream out;\n    for(auto& [key,value]:totals)out<<key<<\": \"<<value<<\"원\\n\";\n    return out.str();\n  }\n};\n"}], "entry": "main.cpp"}
            ],
            java: [
                { 
                    title: "별 찍기 (직각삼각형)", 
                    desc: "Java의 이중 반복문 구조를 익힐 수 있는 가장 기초적인 별 찍기 예제입니다.", 
                    tag: "기초 문법",
                    code: "public class Main {\n    public static void main(String[] args) {\n        int n = 5;\n        for (int i = 1; i <= n; i++) {\n            for (int j = 1; j <= i; j++) {\n                System.out.print(\"*\");\n            }\n            System.out.println();\n        }\n    }\n}"
                },
                { 
                    title: "구구단 출력기", 
                    desc: "반복문 안에서 산술 연산과 문자열 결합을 함께 연습하는 예제입니다.", 
                    tag: "기초 문법",
                    code: "public class Main {\n    public static void main(String[] args) {\n        int dan = 3;\n        System.out.println(\"=== \" + dan + \"단 ===\");\n        for (int i = 1; i <= 9; i++) {\n            System.out.println(dan + \" x \" + i + \" = \" + (dan * i));\n        }\n    }\n}"
                }
,
                {"title": "장바구니 총액 계산", "desc": "상품과 수량 데이터를 배열로 관리하고 할인 계산", "tag": "쇼핑 / 계산", "code": "public class Main {\n  public static void main(String[] args){\n    int[] prices={4500,1200,3000}, quantities={2,3,1};\n    int total=0;\n    for(int i=0;i<prices.length;i++)total+=prices[i]*quantities[i];\n    int discount=total>=10000?total/10:0;\n    System.out.println(\"결제 금액: \"+(total-discount+2500)+\"원\");\n  }\n}\n"},
                {"title": "출석 통계 Map", "desc": "HashMap에 이름별 출결 기록 저장하고 출석 수 계산", "tag": "학교 / 컬렉션", "code": "import java.util.*;\npublic class Main {\n  public static void main(String[] args){\n    Map<String,Boolean> attendance=new LinkedHashMap<>();\n    attendance.put(\"민수\",true);attendance.put(\"수아\",true);attendance.put(\"하린\",false);\n    long count=attendance.values().stream().filter(Boolean::booleanValue).count();\n    System.out.println(\"출석: \"+count+\"명 / \"+attendance.size()+\"명\");\n  }\n}\n"},
                {"title": "재고 부족 알림", "desc": "Map과 조건문으로 매장 재고 모니터링", "tag": "업무 / 컬렉션", "code": "import java.util.*;\npublic class Main {\n  public static void main(String[] args){\n    Map<String,Integer> stock=new LinkedHashMap<>();\n    stock.put(\"우유\",3);stock.put(\"빵\",12);stock.put(\"커피\",2);\n    for(var entry:stock.entrySet())\n      if(entry.getValue()<=4)System.out.println(\"발주 필요: \"+entry.getKey());\n  }\n}\n"},
                {"title": "예약 시간 중복 확인", "desc": "정수 시간 구간을 비교하여 예약 가능 여부 판단", "tag": "서비스 / 예약", "code": "public class Main {\n  static boolean overlap(int start,int end,int otherStart,int otherEnd){\n    return start<otherEnd && end>otherStart;\n  }\n  public static void main(String[] args){\n    int[][] booked={{9,10},{11,13}};\n    int start=12,end=14;boolean available=start<end;\n    for(int[] row:booked)if(overlap(start,end,row[0],row[1]))available=false;\n    System.out.println(available?\"예약 가능\":\"시간 중복\");\n  }\n}\n"},
                {"title": "온도 통계", "desc": "배열과 반복문으로 평균·최고 온도 계산", "tag": "데이터 / 분석", "code": "public class Main {\n  public static void main(String[] args){\n    int[] temperatures={23,25,21,27,24};\n    int sum=0,max=Integer.MIN_VALUE;\n    for(int t:temperatures){sum+=t;max=Math.max(t,max);}\n    System.out.println(\"평균: \"+(double)sum/temperatures.length+\"도\");\n    System.out.println(\"최고: \"+max+\"도\");\n  }\n}\n"},
                {"title": "쇼핑몰 Product + Cart", "desc": "Product.java와 Cart.java를 Main.java에서 연동", "tag": "멀티파일 · 클래스", "files": [{"name": "Main.java", "content": "public class Main {\n  public static void main(String[] args){\n    Cart cart=new Cart();\n    cart.add(new Product(\"Keyboard\",35000),1);\n    cart.add(new Product(\"Mouse\",18000),2);\n    System.out.println(cart.receipt());\n  }\n}\n"}, {"name": "Product.java", "content": "public class Product {\n  public final String name;public final int price;\n  public Product(String name,int price){this.name=name;this.price=price;}\n}\n"}, {"name": "Cart.java", "content": "import java.util.*;\npublic class Cart {\n  private final List<String> lines=new ArrayList<>();\n  private int total=0;\n  public void add(Product p,int qty){lines.add(p.name+\" x\"+qty+\": \"+p.price*qty+\"원\");total+=p.price*qty;}\n  public String receipt(){return String.join(\"\\n\",lines)+\"\\n합계: \"+total+\"원\";}\n}\n"}], "entry": "Main.java"},
                {"title": "회원 User + PointService", "desc": "회원 모델과 포인트 적립 비즈니스 로직을 파일별로 분리", "tag": "멀티파일 · 클래스", "files": [{"name": "Main.java", "content": "public class Main {\n  public static void main(String[] args){\n    User user=new User(\"Minsoo\");PointService service=new PointService();\n    service.earn(user,100);service.earn(user,40);\n    System.out.println(user.name+\": \"+user.points+\" points\");\n  }\n}\n"}, {"name": "User.java", "content": "public class User {\n  public final String name;public int points;\n  public User(String name){this.name=name;this.points=0;}\n}\n"}, {"name": "PointService.java", "content": "public class PointService {\n  public void earn(User user,int amount){\n    if(amount<=0)throw new IllegalArgumentException(\"positive only\");\n    user.points+=amount;\n  }\n}\n"}], "entry": "Main.java"},
                {"title": "거래 Transaction + SpendingReport", "desc": "거래 객체 리스트를 집계 서비스로 전달하는 구조", "tag": "멀티파일 · 클래스", "files": [{"name": "Main.java", "content": "import java.util.*;\npublic class Main {\n  public static void main(String[] args){\n    List<Transaction> rows=Arrays.asList(new Transaction(\"food\",8000),new Transaction(\"bus\",1500),new Transaction(\"food\",9500));\n    System.out.println(new SpendingReport(rows).summary());\n  }\n}\n"}, {"name": "Transaction.java", "content": "public class Transaction {\n  public final String category;public final int amount;\n  public Transaction(String category,int amount){this.category=category;this.amount=amount;}\n}\n"}, {"name": "SpendingReport.java", "content": "import java.util.*;\npublic class SpendingReport {\n  private final List<Transaction> rows;\n  public SpendingReport(List<Transaction> rows){this.rows=rows;}\n  public String summary(){\n    Map<String,Integer> totals=new TreeMap<>();\n    for(Transaction row:rows)totals.merge(row.category,row.amount,Integer::sum);\n    StringBuilder out=new StringBuilder();\n    totals.forEach((k,v)->out.append(k).append(\": \").append(v).append(\"원\\n\"));\n    return out.toString();\n  }\n}\n"}], "entry": "Main.java"}
            ],
            csharp: [
                { 
                    title: "별 찍기 (직각삼각형)", 
                    desc: "C# 콘솔 출력을 이용한 이중 for문 별 찍기 예제입니다.", 
                    tag: "기초 문법",
                    code: "using System;\n\nclass Program {\n    static void Main() {\n        int n = 5;\n        for (int i = 1; i <= n; i++) {\n            for (int j = 1; j <= i; j++) {\n                Console.Write(\"*\");\n            }\n            Console.WriteLine();\n        }\n    }\n}"
                },
                { 
                    title: "구구단 출력기", 
                    desc: "C#의 문자열 보간(String Interpolation) 문법을 활용한 예제입니다.", 
                    tag: "기초 문법",
                    code: "using System;\n\nclass Program {\n    static void Main() {\n        int dan = 3;\n        Console.WriteLine($\"=== {dan}단 ===\");\n        for (int i = 1; i <= 9; i++) {\n            Console.WriteLine($\"{dan} x {i} = {dan * i}\");\n        }\n    }\n}"
                }
,
                {"title": "쇼핑몰 주문 금액 계산", "desc": "배열의 상품 가격과 수량에서 합계·할인 계산", "tag": "쇼핑 / 계산", "code": "using System;\nclass Program {\n  static void Main(){\n    int[] prices={4500,1200,3000}, qty={2,3,1};\n    int total=0;\n    for(int i=0;i<prices.Length;i++)total+=prices[i]*qty[i];\n    int discount=total>=10000?total/10:0;\n    Console.WriteLine($\"결제 금액: {total-discount+2500}원\");\n  }\n}\n"},
                {"title": "출석 통계 LINQ", "desc": "학생 목록을 LINQ로 필터링하여 출석 수 집계", "tag": "학교 / LINQ", "code": "using System;\nusing System.Linq;\nclass Program {\n  static void Main(){\n    bool[] attendance={true,true,false,true};\n    int present=attendance.Count(x=>x);\n    Console.WriteLine($\"출석: {present}/{attendance.Length}\");\n  }\n}\n"},
                {"title": "재고 부족 Dictionary", "desc": "Dictionary 상품 수량을 순회하며 부족 재고 찾기", "tag": "업무 / 컬렉션", "code": "using System;\nusing System.Collections.Generic;\nclass Program {\n  static void Main(){\n    var stock=new Dictionary<string,int>{{\"Milk\",3},{\"Bread\",12},{\"Coffee\",2}};\n    foreach(var item in stock)if(item.Value<=4)\n      Console.WriteLine($\"발주 필요: {item.Key} ({item.Value})\");\n  }\n}\n"},
                {"title": "예약 시간 중복 검사", "desc": "시간 구간을 비교해 예약 가능 여부 출력", "tag": "서비스 / 예약", "code": "using System;\nclass Program {\n  static bool Overlaps(int a,int b,int x,int y)=>a<y&&b>x;\n  static void Main(){\n    int[,] bookings={{9,10},{11,13}};\n    int start=12,end=14;\n    bool available=start<end;\n    for(int i=0;i<bookings.GetLength(0);i++)\n      if(Overlaps(start,end,bookings[i,0],bookings[i,1]))available=false;\n    Console.WriteLine(available?\"예약 가능\":\"시간 중복\");\n  }\n}\n"},
                {"title": "온도 데이터 평균·최고값", "desc": "LINQ Average, Max로 측정값 통계 출력", "tag": "데이터 / LINQ", "code": "using System;\nusing System.Linq;\nclass Program {\n  static void Main(){\n    int[] temps={23,25,21,27,24};\n    Console.WriteLine($\"평균: {temps.Average():F1}도\");\n    Console.WriteLine($\"최고: {temps.Max()}도\");\n  }\n}\n"},
                {"title": "쇼핑몰 Product + Cart", "desc": "Product.cs와 Cart.cs를 Program.cs에서 함께 사용", "tag": "멀티파일 · 클래스", "files": [{"name": "Program.cs", "content": "using System;\nclass Program {\n  static void Main(){\n    var cart=new Cart();cart.Add(new Product(\"Keyboard\",35000),1);\n    cart.Add(new Product(\"Mouse\",18000),2);\n    Console.WriteLine(cart.Receipt());\n  }\n}\n"}, {"name": "Product.cs", "content": "public class Product {\n  public string Name {get;}\n  public int Price {get;}\n  public Product(string name,int price){Name=name;Price=price;}\n}\n"}, {"name": "Cart.cs", "content": "using System.Collections.Generic;\npublic class Cart {\n  private readonly List<string> lines=new List<string>();\n  private int total=0;\n  public void Add(Product p,int quantity){lines.Add($\"{p.Name} x{quantity}: {p.Price*quantity}원\");total+=p.Price*quantity;}\n  public string Receipt()=>string.Join(\"\\n\",lines)+$\"\\n합계: {total}원\";\n}\n"}], "entry": "Program.cs"},
                {"title": "회원 User + PointService", "desc": "회원 객체를 서비스 클래스로 전달해 적립 처리", "tag": "멀티파일 · 클래스", "files": [{"name": "Program.cs", "content": "using System;\nclass Program {\n  static void Main(){\n    var user=new User(\"Minsoo\");var service=new PointService();\n    service.Earn(user,100);service.Earn(user,40);\n    Console.WriteLine($\"{user.Name}: {user.Points} points\");\n  }\n}\n"}, {"name": "User.cs", "content": "public class User {\n  public string Name {get;}\n  public int Points {get;set;}\n  public User(string name){Name=name;}\n}\n"}, {"name": "PointService.cs", "content": "using System;\npublic class PointService {\n  public void Earn(User user,int amount){\n    if(amount<=0)throw new ArgumentException(\"positive only\");\n    user.Points+=amount;\n  }\n}\n"}], "entry": "Program.cs"},
                {"title": "거래 Transaction + SpendingReport", "desc": "데이터 클래스를 리포트 서비스가 받아 카테고리별 합계 계산", "tag": "멀티파일 · 클래스", "files": [{"name": "Program.cs", "content": "using System;\nusing System.Collections.Generic;\nclass Program {\n  static void Main(){\n    var rows=new List<Transaction>{new Transaction(\"food\",8000),new Transaction(\"bus\",1500),new Transaction(\"food\",9500)};\n    Console.WriteLine(new SpendingReport(rows).Summary());\n  }\n}\n"}, {"name": "Transaction.cs", "content": "public class Transaction {\n  public string Category {get;}\n  public int Amount {get;}\n  public Transaction(string category,int amount){Category=category;Amount=amount;}\n}\n"}, {"name": "SpendingReport.cs", "content": "using System.Collections.Generic;\nusing System.Linq;\npublic class SpendingReport {\n  private readonly IEnumerable<Transaction> rows;\n  public SpendingReport(IEnumerable<Transaction> rows){this.rows=rows;}\n  public string Summary()=>string.Join(\"\\n\",rows.GroupBy(x=>x.Category).OrderBy(g=>g.Key).Select(g=>$\"{g.Key}: {g.Sum(x=>x.Amount)}원\"));\n}\n"}], "entry": "Program.cs"}
            ]
        };

