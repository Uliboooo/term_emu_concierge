# Terminal Emulator Selector 仕様書

## 1. Overview

ユーザーの嗜好（パフォーマンス、拡張性、UIなど）に関する7つの質問（+OS判定）に基づき、最適なターミナルエミュレータを診断・提案するReactベースのSingle Page Application (SPA)。結果画面では、ユーザーのOSに応じたインストールコマンドをクリップボードにコピーできる機能を提供する。

## 2. Tech Stack & Environment

* **Framework**: React 18+
* **Styling**: Tailwind CSS
* **Animation**: Custom CSS Keyframes (外部ライブラリ非依存)
* **Background**: HTML5 Canvas 2D API (パーティクルエフェクト)
* **Target**: モダンブラウザ (Chrome, Firefox, Safari, Edge)

## 3. Screen Flow

1. **初期化**: UA（User Agent）解析によるOS自動判定。
2. **質問画面 (Step 1~7)**: 各質問に対する回答を選択。CSSアニメーション付きでシームレスに遷移。
3. **OS選択画面 (Step 8)**: UA判定でOSが特定できなかった場合のみ、フォールバックとして表示。
4. **結果画面**: 最高スコアのターミナルを表示。OSごとのインストールコマンド提示とコピー機能、公式サイトへのリンクを提供する。

## 4. Core Logic

### OS Detection

`navigator.userAgent` を用いて文字列ベースで判定を行う。

* `win` -> Windows
* `mac` -> macOS
* `linux` -> Linux

判定成功時は `selectedOS` stateに該当OSをセットし、8番目のOS確認質問をスキップする（全7問になる）。

### Scoring System

各回答選択肢には、対象ターミナルに対する重み付けスコアが設定されている（例：`{ foot: 5, alacritty: 4 }`）。
回答ごとに該当ターミナルのスコアを加算。最終計算時に `selectedOS` と互換性のないターミナルを除外し、最高スコアのターミナルを選出する。

#### Exclusions by OS

* **Windows**: `windows_terminal`, `alacritty`, `wezterm`, `warp` のみ対象
* **macOS**: `windows_terminal`, `foot` を除外
* **Linux**: `windows_terminal`, `iterm2` を除外

### Clipboard Fallback

`navigator.clipboard.writeText` が動作しない制限された環境（iframe内など）向けに、`document.execCommand('copy')` と隠しテキストエリアを用いたフォールバック処理を実装し、確実なコピー操作を保証する。

## 5. UI/UX Specifications

* **Background**: `requestAnimationFrame` を用いた軽量なCanvasパーティクル描画。ウィンドウのリサイズイベントに動的に追従。
* **Accessibility (a11y)**:
* `aria-live="polite"` によるスクリーンリーダーへの進行状況アナウンス。
* キーボードナビゲーションを前提とした `focus-visible` によるフォーカスリングの明示。


* **Theming**: ダークモード固定（`slate-900` ベース）、アクセントカラーに `emerald-400` を使用したターミナルライクなミニマルデザイン。

## 6. Data Structures

### Question Config

```typescript
interface Question {
  id: number;
  text: string;
  isOSQuestion?: boolean; // 最終のOS質問のみ付与
  options: Array<{
    text: string;
    scores: {
      [terminalKey: string]: number;
    };
  }>;
}

```

### Terminal Details Config

```typescript
interface TerminalDetail {
  name: string;
  description: string;
  features: Array<string>;
  install: {
    macOS?: InstallConfig;
    Linux?: InstallConfig;
    Windows?: InstallConfig;
  };
}

```

### Install Config

```typescript
interface InstallConfig {
  command?: string;  // パッケージマネージャーのコマンド等
  url: string;       // 公式サイトまたはリリースページのURL
  note?: string;     // インストールに関する補足事項
}

```
