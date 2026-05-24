import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      errorMessage: ""
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "알 수 없는 화면 오류가 발생했습니다."
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application render error", {
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      errorMessage: ""
    });
  };

  render() {
    const { children, fallbackTitle = "화면을 불러오지 못했습니다." } = this.props;
    const { hasError, errorMessage } = this.state;

    if (!hasError) {
      return children;
    }

    return (
      <div className="min-h-[320px] rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black text-red-500">ERROR</p>
        <h2 className="mt-2 text-2xl font-black text-stone-950">
          {fallbackTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-6 text-stone-500">
          일시적인 화면 오류가 발생했습니다. 입력하신 예약 데이터는 브라우저 저장소 기준으로 보호됩니다.
        </p>
        <p className="mt-3 rounded-2xl bg-stone-50 px-4 py-3 text-xs font-bold text-stone-500">
          {errorMessage}
        </p>
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-5 rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:bg-stone-800"
        >
          다시 시도
        </button>
      </div>
    );
  }
}
