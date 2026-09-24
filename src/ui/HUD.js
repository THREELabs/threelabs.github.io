import * as THREE from 'three';
import { gameState } from '../state.js';
import { ZONES } from '../constants.js';
import { AUTO_REPAIR_SHOPS, SCENIC_PARKING_LOTS } from '../world/SplineRoad.js';
import { getHistoricalLore, TOTAL_HISTORICAL_ARCHIVES, HISTORICAL_LORE_DATABASE } from '../world/HistoricalLore.js';
import { getLandmarkPhotos } from '../world/LandmarkPhotos.js';
import { ZONE_CLUES_CONFIG } from '../world/MysteryCrimeScene.js';
import { youtubePlayer, CURATED_ROAD_TRACKS, extractYouTubeVideoId } from '../audio/YouTubePlayer.js';

export class HUD {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud-root';
    this.container.innerHTML = `
      <style>
        #hud-root {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          user-select: none;
          color: #ffffff;
          z-index: 100;
        }
        .hud-panel {
          background: rgba(14, 18, 24, 0.88);
          border: 2px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.45);
          padding: 12px 18px;
        }

        /* Driving Dashboard (MPH & Gauges Panel removed per user request) */
        #hud-speedometer {
          display: none !important;
        }
        .speed-val {
          font-size: 54px;
          font-weight: 900;
          letter-spacing: -2px;
          line-height: 1;
          color: #fff6d6;
          text-shadow: 0 0 20px rgba(255,200,60,0.5);
        }
        .speed-unit {
          font-size: 16px;
          font-weight: 700;
          color: #f4c522;
          margin-left: 4px;
        }
        .bar-container {
          margin-top: 8px;
        }
        .bar-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #a0b0c0;
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .bar-track {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.12);
          border-radius: 4px;
          overflow: hidden;
        }
        .bar-fill-nitro {
          height: 100%;
          background: linear-gradient(90deg, #f4c522, #ff5722);
          width: 100%;
          transition: width 0.05s linear;
        }
        .bar-fill-heat {
          height: 100%;
          background: linear-gradient(90deg, #33aaff, #ff3344);
          width: 0%;
          transition: width 0.05s linear;
        }

        .bar-fill-integrity {
          height: 100%;
          background: linear-gradient(90deg, #ef4444 0%, #facc15 45%, #22c55e 80%, #38bdf8 100%);
          width: 100%;
          border-radius: 3px;
          transition: width 0.15s ease-out;
        }

        /* Top Minimal Bar with Live FPS Tracker */
        #hud-top-bar {
          position: absolute;
          top: 20px;
          right: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
          pointer-events: auto;
          z-index: 110;
        }
        .hud-live-fps-badge {
          background: linear-gradient(135deg, rgba(14, 28, 48, 0.94) 0%, rgba(10, 16, 26, 0.94) 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.45);
          border-radius: 24px;
          padding: 7px 14px;
          color: #f8fafc;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(56, 189, 248, 0.25);
          backdrop-filter: blur(10px);
          cursor: pointer;
          pointer-events: auto;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .hud-live-fps-badge:hover {
          transform: scale(1.05);
          border-color: #38bdf8;
          box-shadow: 0 6px 24px rgba(56, 189, 248, 0.45);
        }
        .hud-live-fps-badge .fps-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          transition: background 0.2s ease, box-shadow 0.2s ease;
        }
        .hud-top-btn {
          background: linear-gradient(135deg, rgba(14, 28, 48, 0.94) 0%, rgba(10, 16, 26, 0.94) 100%);
          border: 1.5px solid rgba(245, 158, 11, 0.45);
          border-radius: 24px;
          padding: 7px 14px;
          color: #f8fafc;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(245, 158, 11, 0.25);
          backdrop-filter: blur(10px);
          cursor: pointer;
          pointer-events: auto;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .hud-top-btn:hover {
          transform: scale(1.05);
          border-color: #f59e0b;
          box-shadow: 0 6px 24px rgba(245, 158, 11, 0.45);
        }
        .hud-live-fps-badge.fps-green .fps-dot { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .hud-live-fps-badge.fps-yellow .fps-dot { background: #eab308; box-shadow: 0 0 8px #eab308; }
        .hud-live-fps-badge.fps-red .fps-dot { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .hud-live-fps-badge #hud-live-fps-val {
          font-family: monospace;
          font-size: 13px;
          font-weight: 900;
          color: #f8fafc;
          min-width: 22px;
          text-align: right;
        }
        .hud-live-fps-badge .fps-unit {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.8px;
        }
        .hud-live-fps-badge .fps-ms-val {
          font-size: 10px;
          font-weight: 700;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 6px;
          padding: 1px 5px;
          margin-left: 2px;
          font-family: monospace;
        }
        .hud-btn-tablet {
          background: linear-gradient(135deg, rgba(14, 28, 48, 0.94) 0%, rgba(10, 16, 26, 0.94) 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.6);
          border-radius: 24px;
          padding: 8px 18px;
          color: #f8fafc;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 16px rgba(56, 189, 248, 0.3);
          backdrop-filter: blur(10px);
          cursor: pointer;
          pointer-events: auto;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .hud-btn-tablet:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(14, 28, 48, 0.98) 100%);
          border-color: #38bdf8;
          box-shadow: 0 6px 24px rgba(56, 189, 248, 0.5);
        }
        .hud-btn-tablet:active {
          transform: scale(0.96);
        }
        .tablet-key-hint {
          font-size: 10px;
          font-weight: 700;
          color: #ffd152;
          background: rgba(255, 209, 82, 0.15);
          border: 1px solid rgba(255, 209, 82, 0.4);
          border-radius: 6px;
          padding: 1px 6px;
          margin-left: 2px;
        }
        .hud-btn-telemetry {
          border-color: rgba(245, 158, 11, 0.65);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 16px rgba(245, 158, 11, 0.25);
        }
        .hud-btn-telemetry:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(14, 28, 48, 0.98) 100%);
          border-color: #f59e0b;
          box-shadow: 0 6px 24px rgba(245, 158, 11, 0.45);
        }
        .hud-btn-telemetry.active {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(14, 28, 48, 0.98) 100%);
          border-color: #f59e0b;
          box-shadow: 0 6px 24px rgba(245, 158, 11, 0.55);
        }
        @media (max-width: 920px), (hover: none), (pointer: coarse) {
          #hud-top-bar {
            top: max(14px, env(safe-area-inset-top, 0px) + 8px) !important;
            right: max(14px, env(safe-area-inset-right, 0px) + 8px) !important;
            gap: 6px !important;
          }
          .hud-btn-tablet {
            padding: 6px 12px !important;
            font-size: 11px !important;
            gap: 5px !important;
          }
          .tablet-key-hint {
            display: none !important;
          }
        }

        /* 📱 In-Car Digital Tablet OS Modal Overlay */
        #hud-tablet-modal {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(4, 8, 16, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 250;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 16px;
          box-sizing: border-box;
        }
        #hud-tablet-modal.open {
          display: flex;
          opacity: 1;
          pointer-events: auto;
        }
        .tablet-device {
          width: 100%;
          max-width: 960px;
          height: 88vh;
          max-height: 640px;
          background: linear-gradient(180deg, #0b111e 0%, #060911 100%);
          border: 3px solid rgba(56, 189, 248, 0.45);
          border-radius: 26px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.95), 0 0 45px rgba(56, 189, 248, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          user-select: none;
          animation: tabletPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes tabletPop {
          0% { transform: scale(0.93) translateY(18px); opacity: 0; }
          100% { transform: scale(1.0) translateY(0); opacity: 1; }
        }
        .tablet-status-bar {
          background: rgba(15, 23, 42, 0.85);
          border-bottom: 1.5px solid rgba(56, 189, 248, 0.25);
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }
        .tablet-status-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tablet-brand {
          color: #38bdf8;
          font-weight: 900;
          letter-spacing: 1.2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tablet-status-zone {
          color: #ffd152;
          background: rgba(255, 209, 82, 0.12);
          border: 1px solid rgba(255, 209, 82, 0.3);
          border-radius: 12px;
          padding: 2px 10px;
          font-size: 10px;
          font-weight: 800;
        }
        .tablet-status-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .tablet-close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #cbd5e1;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .tablet-close-btn:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
          transform: scale(1.08);
        }
        .tablet-body {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .tablet-view {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          display: none;
          flex-direction: column;
          box-sizing: border-box;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .tablet-view.active {
          display: flex;
          opacity: 1;
        }

        /* Tablet Home Grid */
        .tablet-home-container {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
          height: 100%;
          box-sizing: border-box;
        }
        .tablet-welcome-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 12px 20px;
        }
        .tablet-welcome-title {
          font-size: 16px;
          font-weight: 900;
          color: #f8fafc;
          letter-spacing: 0.5px;
        }
        .tablet-welcome-sub {
          font-size: 12px;
          color: #94a3b8;
        }
        .tablet-app-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 768px) {
          .tablet-app-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .tablet-app-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }
        .tablet-app-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: #38bdf8;
          box-shadow: 0 8px 24px rgba(56, 189, 248, 0.35);
          background: linear-gradient(145deg, rgba(14, 165, 233, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%);
        }
        .tablet-app-card:active {
          transform: scale(0.97);
        }
        .tablet-app-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }
        .tablet-app-name {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.5px;
        }
        .tablet-app-tag {
          font-size: 10px;
          color: #94a3b8;
          line-height: 1.3;
        }

        /* App View Header */
        .tablet-nav-header {
          padding: 14px 20px;
          background: rgba(15, 23, 42, 0.75);
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .tablet-nav-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tablet-back-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #38bdf8;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.5px;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .tablet-back-btn:hover {
          background: #38bdf8;
          color: #0f172a;
        }
        .tablet-view-title {
          font-size: 15px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .tablet-scroll-body {
          flex: 1;
          padding: 20px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tablet-scroll-body::-webkit-scrollbar {
          width: 6px;
        }
        .tablet-scroll-body::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.3);
          border-radius: 3px;
        }
        .tablet-home-indicator {
          width: 140px;
          height: 5px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 3px;
          margin: 6px auto 10px;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
        }
        .tablet-home-indicator:hover {
          background: #38bdf8;
          transform: scaleX(1.1);
        }

        /* 🗺️ Milestones & Live GPS Map App Components */
        .milestone-hero-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          border: 2px solid rgba(255, 209, 82, 0.5);
          border-radius: 16px;
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.5);
          flex-wrap: wrap;
        }
        .milestone-zone-tag {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #ffd152;
          text-transform: uppercase;
        }
        .milestone-hero-title {
          font-size: 22px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.2;
          margin: 3px 0;
        }
        .milestone-hero-sub {
          font-size: 13px;
          color: #cbd5e1;
        }
        .milestone-hero-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .milestone-temp-badge {
          background: rgba(14, 28, 48, 0.9);
          border: 1px solid rgba(56, 189, 248, 0.5);
          border-radius: 20px;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 800;
          color: #38bdf8;
        }
        .milestone-dist-badge {
          font-size: 12px;
          font-weight: 800;
          color: #94a3b8;
        }

        .tab-gps-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
        }
        @media (max-width: 800px) {
          .tab-gps-grid {
            grid-template-columns: 1fr;
          }
        }
        .tab-radar-card {
          background: rgba(15, 23, 42, 0.85);
          border: 1.5px solid rgba(56, 189, 248, 0.4);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }
        #tab-radar-canvas {
          width: 240px;
          height: 240px;
          border-radius: 50%;
          border: 3px solid rgba(56, 189, 248, 0.7);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.4), inset 0 0 25px rgba(0,0,0,0.8);
          background: #0b111e;
        }
        .tab-gps-telemetry {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11px;
          color: #cbd5e1;
        }
        .tab-gps-telemetry-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 6px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 6px;
        }

        .milestone-progress-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .milestone-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 800;
          color: #f8fafc;
        }
        .milestone-checkpoint-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .milestone-checkpoint-list::-webkit-scrollbar {
          width: 5px;
        }
        .milestone-checkpoint-list::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.3);
          border-radius: 3px;
        }
        .milestone-checkpoint-item {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 8px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.15s ease;
        }
        .milestone-checkpoint-item.completed {
          border-color: rgba(34, 197, 94, 0.4);
          background: rgba(34, 197, 94, 0.08);
        }
        .milestone-checkpoint-item.current {
          border-color: #ffd152;
          background: rgba(255, 209, 82, 0.15);
          box-shadow: 0 0 16px rgba(255, 209, 82, 0.3);
        }
        .checkpoint-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .checkpoint-icon { font-size: 18px; }
        .checkpoint-name { font-size: 12px; font-weight: 800; color: #ffffff; }
        .checkpoint-km { font-size: 10px; color: #94a3b8; }
        .checkpoint-status-badge {
          font-size: 9.5px;
          font-weight: 900;
          letter-spacing: 0.8px;
          padding: 3px 8px;
          border-radius: 12px;
          text-transform: uppercase;
        }
        .badge-completed {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }
        .badge-current {
          background: rgba(255, 209, 82, 0.25);
          color: #ffd152;
          border: 1px solid rgba(255, 209, 82, 0.6);
        }
        .badge-ahead {
          background: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* ⚡ Zone Skipper App Components */
        .dev-quick-toolbar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 10px 14px;
          background: rgba(10, 15, 26, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
        .dev-tool-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e2e8f0;
          font-size: 11px;
          font-weight: 800;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dev-tool-btn:hover {
          background: rgba(56, 189, 248, 0.3);
          border-color: #38bdf8;
          color: #ffffff;
        }
        .dev-btn-primary {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          border-color: #38bdf8;
          color: #ffffff;
        }
        .dev-btn-danger {
          background: rgba(220, 38, 38, 0.3);
          border-color: #ef4444;
          color: #fca5a5;
        }
        .dev-btn-danger:hover {
          background: #ef4444;
          color: #ffffff;
        }
        .dev-btn-success {
          background: rgba(34, 197, 94, 0.3);
          border-color: #22c55e;
          color: #86efac;
        }
        .dev-btn-success:hover {
          background: #22c55e;
          color: #ffffff;
        }
        .dev-tabs-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dev-tab-header {
          display: flex;
          gap: 8px;
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
          flex-wrap: wrap;
        }
        .dev-tab-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dev-tab-btn.active, .dev-tab-btn:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38bdf8;
          color: #ffffff;
        }
        .dev-tab-content {
          display: none;
        }
        .dev-tab-content.active {
          display: block;
        }
        .zone-modal-grid, .repair-shop-warp-grid, .offroad-warp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 768px) {
          .zone-modal-grid, .repair-shop-warp-grid, .offroad-warp-grid {
            grid-template-columns: repeat(1, 1fr);
          }
        }
        .zone-card, .shop-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 12px 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .zone-card:hover, .shop-card:hover {
          transform: translateY(-2px);
          border-color: #38bdf8;
          background: rgba(30, 41, 59, 0.85);
          box-shadow: 0 4px 16px rgba(56, 189, 248, 0.3);
        }
        .offroad-card {
          background: linear-gradient(145deg, rgba(6, 78, 59, 0.45), rgba(15, 23, 42, 0.85)) !important;
          border-color: rgba(52, 211, 153, 0.45) !important;
        }
        .offroad-card:hover {
          border-color: #34d399 !important;
          background: linear-gradient(145deg, rgba(6, 78, 59, 0.75), rgba(15, 23, 42, 0.95)) !important;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.45) !important;
        }
        .zone-card.active-zone {
          border-color: #ffd152;
          background: rgba(255, 209, 82, 0.15);
          box-shadow: 0 0 16px rgba(255, 209, 82, 0.4);
        }
        .zone-card-top, .shop-card-badge {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #38bdf8;
        }
        .zone-card-name, .shop-card-name {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
        }
        .zone-card-sub, .shop-card-desc {
          font-size: 10.5px;
          color: #94a3b8;
        }
        .shop-warp-btn {
          margin-top: 6px;
          background: linear-gradient(135deg, #0284c7, #0369a1);
          color: #fff;
          border: none;
          font-size: 10px;
          font-weight: 800;
          padding: 5px 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* 🎥 Camera & Optics App */
        .camera-grid, .weather-grid, .livery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (max-width: 600px) {
          .camera-grid, .weather-grid, .livery-grid {
            grid-template-columns: 1fr;
          }
        }
        .camera-card, .weather-card, .livery-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .camera-card:hover, .weather-card:hover, .livery-card:hover {
          border-color: #38bdf8;
          background: rgba(30, 41, 59, 0.85);
          transform: translateY(-2px);
          box-shadow: 0 4px 18px rgba(56, 189, 248, 0.25);
        }
        .camera-card.active, .weather-card.active, .livery-card.active {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.15);
          box-shadow: 0 0 16px rgba(34, 197, 94, 0.35);
        }
        .camera-card-icon, .weather-card-icon, .livery-swatch {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        }

        /* 🔧 Diagnostics & Vehicle Reset App */
        .diag-action-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 650px) {
          .diag-action-strip {
            grid-template-columns: 1fr;
          }
        }
        .diag-hero-btn {
          padding: 16px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          cursor: pointer;
          font-weight: 800;
          transition: all 0.15s ease;
          border: 1.5px solid transparent;
        }
        .diag-hero-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.5);
        }
        .diag-status-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .diag-metric-box {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* 📊 System Telemetry & FPS App */
        .perf-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 768px) {
          .perf-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .perf-kpi-card {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .perf-kpi-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .perf-kpi-val {
          font-size: 22px;
          font-weight: 900;
          font-family: monospace;
          color: #38bdf8;
        }
        .perf-kpi-val.green { color: #22c55e; }
        .perf-kpi-val.yellow { color: #facc15; }
        .perf-kpi-val.red { color: #ef4444; }
        .perf-kpi-sub {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 600;
        }
        .perf-graph-container {
          background: rgba(5, 8, 14, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .perf-graph-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
        }
        #fps-graph-canvas {
          width: 100%;
          height: 60px;
          display: block;
          border-radius: 6px;
        }

        /* Scenic Turnout Highway Discovery Banner */
        #hud-scenic-waypoint {
          position: absolute;
          top: 22px;
          left: 50%;
          transform: translateX(-50%) translateY(-140px);
          display: flex;
          flex-direction: column;
          width: min(580px, calc(100vw - 24px));
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 50%, rgba(15, 23, 42, 0.98) 100%);
          border: 2px solid rgba(245, 158, 11, 0.75);
          border-radius: 16px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.75), 0 0 30px rgba(245, 158, 11, 0.35);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          pointer-events: auto;
          cursor: pointer;
          z-index: 100;
          overflow: hidden;
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        #hud-scenic-waypoint.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        #hud-scenic-waypoint.pop-alert {
          animation: scenicPulsePop 1.6s ease-in-out;
        }
        @keyframes scenicPulsePop {
          0% { transform: translateX(-50%) scale(0.92); }
          50% { transform: translateX(-50%) scale(1.03); box-shadow: 0 12px 45px rgba(0, 0, 0, 0.85), 0 0 45px rgba(250, 204, 21, 0.7); }
          100% { transform: translateX(-50%) scale(1.0); }
        }
        #hud-scenic-waypoint.in-lot {
          border-color: #38bdf8;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.65), 0 0 35px rgba(56, 189, 248, 0.6);
          background: linear-gradient(135deg, rgba(12, 74, 110, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%);
        }
        @media (max-width: 920px), (hover: none), (pointer: coarse) {
          #hud-scenic-waypoint {
            top: 68px !important;
            left: 50% !important;
            transform: translateX(-50%) translateY(-140px) !important;
            width: min(calc(100vw - 16px), 480px) !important;
          }
          #hud-scenic-waypoint.visible {
            transform: translateX(-50%) translateY(0) !important;
          }
        }
        body.has-touch-controls #hud-scenic-waypoint {
          top: 68px !important;
          left: 50% !important;
          transform: translateX(-50%) translateY(-140px) !important;
          width: min(calc(100vw - 16px), 480px) !important;
        }
        body.has-touch-controls #hud-scenic-waypoint.visible {
          transform: translateX(-50%) translateY(0) !important;
        }
        .scenic-banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px 8px 12px;
          gap: 12px;
        }
        .scenic-waypoint-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .scenic-waypoint-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #d97706, #b45309);
          border: 1.5px solid #fde047;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
          flex-shrink: 0;
        }
        .scenic-waypoint-icon {
          font-size: 24px;
          line-height: 1;
        }
        .scenic-waypoint-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .scenic-waypoint-tagline {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .scenic-tag-badge {
          color: #facc15;
          white-space: nowrap;
        }
        .scenic-exit-indicator {
          background: #f59e0b;
          color: #0f172a;
          padding: 1.5px 7px;
          border-radius: 6px;
          font-weight: 900;
          font-size: 8.5px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .scenic-waypoint-name {
          font-size: 14px;
          font-weight: 900;
          color: #ffffff;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          line-height: 1.25;
          margin-top: 2px;
        }
        .scenic-waypoint-sub {
          font-size: 11px;
          font-weight: 600;
          color: #cbd5e1;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          line-height: 1.35;
          margin-top: 2px;
        }
        .scenic-waypoint-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          gap: 5px;
          flex-shrink: 0;
        }
        .scenic-banner-close {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #94a3b8;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          transition: background 0.2s, color 0.2s, transform 0.15s, border-color 0.2s;
        }
        .scenic-banner-close:hover {
          background: rgba(239, 68, 68, 0.85);
          border-color: #ef4444;
          color: #ffffff;
          transform: scale(1.1);
        }
        body.has-touch-controls .scenic-banner-close {
          width: 26px;
          height: 26px;
          font-size: 13px;
        }
        .scenic-dist-badge {
          display: flex;
          align-items: baseline;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(250, 204, 21, 0.4);
          border-radius: 8px;
          padding: 3px 8px;
          white-space: nowrap;
        }
        .scenic-dist-num {
          font-size: 19px;
          font-weight: 900;
          color: #fde047;
          font-family: monospace, sans-serif;
        }
        .scenic-dist-unit {
          font-size: 11px;
          font-weight: 800;
          color: #fde047;
          margin-left: 2px;
        }
        .scenic-action-hint-bar {
          background: rgba(0, 0, 0, 0.28);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px 12px 5px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .scenic-action-hint {
          font-size: 9.5px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.3;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
        }
        .scenic-progress-track {
          width: 100%;
          height: 4px;
          background: rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        .scenic-progress-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #f59e0b, #38bdf8);
          transition: width 0.15s linear;
        }

        /* Prominent Manual Gearbox Wrong Gear Alert Banner */
        #hud-gear-alert {
          position: fixed;
          top: 68px;
          left: 50%;
          transform: translateX(-50%) translateY(-10px);
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 2px solid #f59e0b;
          box-shadow: 0 0 25px rgba(245, 158, 11, 0.6), 0 8px 32px rgba(0, 0, 0, 0.85);
          border-radius: 12px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 9999;
          opacity: 0;
          pointer-events: none;
          cursor: pointer;
          user-select: none;
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        #hud-gear-alert.visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
          animation: gearAlertGlow 1.2s infinite ease-in-out;
        }
        #hud-gear-alert.danger {
          border-color: #ef4444;
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.75), 0 8px 32px rgba(0, 0, 0, 0.85);
        }
        @keyframes gearAlertGlow {
          0%, 100% {
            box-shadow: 0 0 16px rgba(245, 158, 11, 0.5), 0 6px 24px rgba(0,0,0,0.8);
            transform: translateX(-50%) scale(1.0);
          }
          50% {
            box-shadow: 0 0 28px rgba(245, 158, 11, 0.95), 0 8px 32px rgba(0,0,0,0.9);
            transform: translateX(-50%) scale(1.03);
          }
        }
        .gear-alert-icon {
          font-size: 26px;
          animation: gearIconJiggle 0.8s infinite alternate ease-in-out;
        }
        @keyframes gearIconJiggle {
          0% { transform: rotate(-6deg) scale(1.0); }
          100% { transform: rotate(6deg) scale(1.15); }
        }
        .gear-alert-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .gear-alert-title {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.8px;
          color: #fbbf24;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        #hud-gear-alert.danger .gear-alert-title {
          color: #f87171;
        }
        .gear-alert-subtitle {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #cbd5e1;
          margin-top: 1px;
        }
        .gear-alert-key-hint {
          display: inline-block;
          background: #f59e0b;
          color: #0f172a;
          font-weight: 900;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          letter-spacing: 0.5px;
        }
        #hud-gear-alert.danger .gear-alert-key-hint {
          background: #ef4444;
          color: #ffffff;
        }

        #hud-history-prompt-pill {
          position: absolute;
          bottom: 110px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          display: none;
          align-items: center;
          gap: 12px;
          max-width: min(calc(100vw - 32px), 440px);
          box-sizing: border-box;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%);
          border: 2px solid #f59e0b;
          border-radius: 30px;
          padding: 10px 20px;
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.7), 0 0 20px rgba(245, 158, 11, 0.55);
          backdrop-filter: blur(10px);
          pointer-events: auto;
          cursor: pointer;
          z-index: 60;
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        #hud-history-prompt-pill.visible {
          display: flex;
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .history-prompt-header { font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #fbbf24; text-transform: uppercase; }
        .history-prompt-name {
          font-size: 14px;
          font-weight: 800;
          color: #ffffff;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          line-height: 1.3;
        }
        .history-prompt-action {
          background: #f59e0b;
          color: #0f172a;
          font-weight: 900;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 12px;
          margin-left: 6px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        /* Responsive placement: Ensure prompt pill and toasts never collide with touch driving controls */
        @media (max-width: 920px), (hover: none), (pointer: coarse) {
          #hud-history-prompt-pill {
            padding: 8px 14px;
            gap: 8px;
            max-width: min(calc(100vw - 20px), 480px);
          }
          .history-prompt-name {
            font-size: 13px;
          }
          .history-key-hint {
            display: none !important;
          }
        }

        /* Portrait orientation on mobile/touch: Driving pedals & steering occupy bottom 0~180px, position above controls */
        @media (max-width: 920px) and (orientation: portrait), (max-aspect-ratio: 1/1) {
          #hud-history-prompt-pill {
            bottom: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 185px) !important;
          }
          #hud-action-toast {
            bottom: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 185px) !important;
          }
        }

        /* Landscape orientation on mobile: Controls are in corner clusters, position pill neatly in bottom center */
        @media (max-width: 920px) and (orientation: landscape), (min-aspect-ratio: 1/1) and (max-height: 550px) {
          #hud-history-prompt-pill {
            bottom: max(14px, calc(env(safe-area-inset-bottom, 0px) + 10px)) !important;
          }
          #hud-action-toast {
            bottom: max(14px, calc(env(safe-area-inset-bottom, 0px) + 10px)) !important;
          }
        }

        body.has-touch-controls #hud-history-prompt-pill {
          bottom: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 185px);
          padding: 8px 14px;
          gap: 8px;
          max-width: min(calc(100vw - 20px), 480px);
        }
        body.has-touch-controls .history-key-hint {
          display: none !important;
        }
        @media (orientation: landscape) {
          body.has-touch-controls #hud-history-prompt-pill {
            bottom: max(14px, calc(env(safe-area-inset-bottom, 0px) + 10px));
          }
          body.has-touch-controls #hud-action-toast {
            bottom: max(14px, calc(env(safe-area-inset-bottom, 0px) + 10px));
          }
        }

        /* 👁️ Scenic Binoculars Interaction Prompt Pill */
        #hud-binocular-prompt-pill {
          position: absolute;
          bottom: 96px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.92));
          border: 2px solid #f59e0b;
          border-radius: 30px;
          display: none;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.7), 0 0 20px rgba(245, 158, 11, 0.55);
          backdrop-filter: blur(10px);
          pointer-events: auto;
          cursor: pointer;
          z-index: 60;
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        #hud-binocular-prompt-pill.visible {
          display: flex;
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .binocular-prompt-header { font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #fbbf24; text-transform: uppercase; }
        .binocular-prompt-name {
          font-size: 14px;
          font-weight: 800;
          color: #ffffff;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          line-height: 1.3;
        }
        .binocular-prompt-action {
          background: #f59e0b;
          color: #0f172a;
          font-weight: 900;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 12px;
          margin-left: 6px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        @media (max-width: 920px), (hover: none), (pointer: coarse) {
          #hud-binocular-prompt-pill {
            bottom: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 140px);
            padding: 8px 14px;
            gap: 8px;
            max-width: min(calc(100vw - 20px), 480px);
          }
        }
        body.has-touch-controls #hud-binocular-prompt-pill {
          bottom: calc(max(20px, env(safe-area-inset-bottom, 0px)) + 140px);
          padding: 8px 14px;
          gap: 8px;
          max-width: min(calc(100vw - 20px), 480px);
        }
        body.has-touch-controls .bino-key-hint {
          display: none !important;
        }

        /* 👁️ Scenic Coin-Operated Binoculars Fullscreen Optical Overlay */
        #hud-binocular-overlay {
          position: fixed;
          inset: 0;
          z-index: 850;
          display: none;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: auto;
          user-select: none;
          background: radial-gradient(ellipse at center, transparent 38%, rgba(0, 5, 12, 0.45) 54%, rgba(0, 2, 6, 0.88) 68%, #000000 82%);
          box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.98), inset 0 0 240px rgba(0, 0, 0, 0.85);
        }
        #hud-binocular-overlay.open {
          display: flex;
        }
        @media (max-width: 640px) {
          #hud-binocular-overlay {
            background: radial-gradient(circle at center, transparent 35%, rgba(0, 5, 12, 0.5) 52%, rgba(0, 2, 6, 0.9) 68%, #000000 82%);
          }
        }
        
        .binocular-crosshair-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .binocular-reticle {
          position: relative;
          width: 340px;
          height: 340px;
        }
        .binocular-reticle-circle {
          position: absolute;
          inset: 38px;
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.25), inset 0 0 10px rgba(255, 255, 255, 0.15);
        }
        .binocular-cross-h {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5) 15%, #ffffff 50%, rgba(255, 255, 255, 0.5) 85%, transparent);
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
        }
        .binocular-cross-v {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1.5px;
          background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.5) 15%, #ffffff 50%, rgba(255, 255, 255, 0.5) 85%, transparent);
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
        }
        .binocular-mil-dots {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-size: 10px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 2px;
          text-shadow: 0 0 8px rgba(0, 0, 0, 0.9), 0 0 4px rgba(255, 255, 255, 0.6);
          pointer-events: none;
        }

        .binocular-top-bar {
          position: relative;
          z-index: 10;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
          font-family: system-ui, sans-serif;
        }
        .binocular-title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .binocular-brand {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 3px;
          color: #f59e0b;
          text-transform: uppercase;
        }
        .binocular-view-name {
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        }
        .binocular-compass-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 20px;
          padding: 6px 14px;
          color: #fbbf24;
          font-size: 13px;
          font-weight: 800;
          font-family: monospace;
          letter-spacing: 1px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }

        .binocular-bottom-bar {
          position: relative;
          z-index: 10;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.95) 0%, transparent 100%);
          font-family: system-ui, sans-serif;
          gap: 16px;
          flex-wrap: wrap;
        }
        .binocular-target-box {
          display: flex;
          flex-direction: column;
          gap: 3px;
          max-width: 60%;
        }
        .binocular-target-label {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #38bdf8;
          text-transform: uppercase;
        }
        .binocular-target-val {
          font-size: 14px;
          font-weight: 800;
          color: #f8fafc;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          line-height: 1.3;
        }
        .binocular-controls-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .binocular-zoom-indicator {
          font-family: monospace;
          font-size: 13px;
          font-weight: 800;
          color: #f59e0b;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(245, 158, 11, 0.4);
          padding: 6px 12px;
          border-radius: 8px;
        }
        .binocular-btn {
          background: #1e293b;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-weight: 800;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .binocular-btn:hover {
          background: #334155;
          border-color: #f59e0b;
        }
        .binocular-btn-exit {
          background: #991b1b;
          border-color: #ef4444;
          color: #fff;
          font-weight: 900;
        }
        .binocular-btn-exit:hover {
          background: #dc2626;
        }

        #hud-root.in-binocular-view .speedometer,
        #hud-root.in-binocular-view .tachometer,
        #hud-root.in-binocular-view .minimap,
        #hud-root.in-binocular-view .nitro-gauge,
        #hud-root.in-binocular-view .zone-banner,
        #hud-root.in-binocular-view .controls-hint,
        #hud-root.in-binocular-view #start-awaken-btn,
        #hud-root.in-binocular-view #hud-binocular-prompt-pill,
        #hud-root.in-binocular-view #hud-history-prompt-pill {
          display: none !important;
        }

        /* 🎬 Cinematic Letterbox Cutscene Overlay */
        #hud-cutscene-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none;
          z-index: 1200;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.4s ease, visibility 0.4s;
        }
        #hud-cutscene-overlay.active {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .cutscene-bar {
          width: 100%;
          height: 8vh;
          min-height: 48px;
          max-height: 72px;
          background: #000000;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          box-sizing: border-box;
          z-index: 10;
        }
        .cutscene-rec-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: monospace;
          font-size: 13px;
          font-weight: 700;
          color: #ef4444;
          letter-spacing: 2px;
        }
        .cutscene-rec-dot {
          width: 10px;
          height: 10px;
          background: #ef4444;
          border-radius: 50%;
          animation: recBlink 1s infinite alternate ease-in-out;
        }
        @keyframes recBlink {
          0% { opacity: 0.2; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1.1); }
        }
        .cutscene-title {
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 3px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
        }
        .cutscene-skip-btn {
          pointer-events: auto;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          padding: 6px 14px;
          letter-spacing: 1.5px;
          transition: background 0.2s, transform 0.1s;
        }
        .cutscene-skip-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        .cutscene-letterbox-content {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: clamp(68px, 10.5vh, 98px);
          pointer-events: none;
        }
        .cutscene-subtitles-box {
          background: linear-gradient(180deg, rgba(10, 15, 26, 0.92) 0%, rgba(6, 10, 18, 0.96) 100%);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(250, 204, 21, 0.45);
          border-radius: 14px;
          padding: 14px 30px;
          max-width: min(860px, 86vw);
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.9), 0 0 24px rgba(234, 179, 8, 0.2);
          text-align: center;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
        }
        .cutscene-subtitles-text {
          color: #f8fafc;
          font-size: clamp(15px, 2.2vw, 19px);
          font-weight: 700;
          letter-spacing: 0.5px;
          line-height: 1.55;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95);
        }

        body.in-cutscene #mobile-touch-root,
        #hud-root.in-cutscene #hud-scenic-waypoint,
        #hud-root.in-cutscene #hud-gear-alert,
        #hud-root.in-cutscene #hud-4x4-badge,
        #hud-root.in-cutscene #hud-speedometer,
        #hud-root.in-cutscene #hud-tablet-modal,
        #hud-root.in-cutscene #hud-history-modal,
        #hud-root.in-cutscene #hud-binocular-prompt-pill,
        #hud-root.in-cutscene #hud-history-prompt-pill,
        #hud-root.in-cutscene #hud-gear-shift-indicator,
        #hud-root.in-cutscene #hud-action-toast,
        #hud-root.in-cutscene #hud-binocular-overlay,
        #hud-root.in-cutscene .zone-banner,
        #hud-root.in-cutscene .minimap,
        #hud-root.in-cutscene .nitro-gauge,
        #hud-root.in-cutscene .controls-hint,
        #hud-root.in-cutscene #hud-manual-gearbox-toggle,
        #hud-root.in-cutscene #hud-photo-kiosk-prompt,
        #hud-root.in-cutscene #hud-rescue-toast,
        #hud-root.in-cutscene #hud-drift-badge,
        #hud-root.in-cutscene #hud-flip-alert,
        #hud-root.in-cutscene #hud-radar-alert,
        #hud-root.in-cutscene #hud-speed-gauge {
          display: none !important;
        }

        /* Historical Modal */
        #hud-history-modal {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(5, 8, 14, 0.88);
          backdrop-filter: blur(12px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 300;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          padding: 20px;
          box-sizing: border-box;
        }
        #hud-history-modal.open {
          display: flex;
          opacity: 1;
          pointer-events: auto;
        }
        .history-modal-card {
          background: linear-gradient(180deg, #131b2a 0%, #0d131f 100%);
          border: 2px solid rgba(245, 158, 11, 0.6);
          border-radius: 18px;
          box-shadow: 0 16px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.35);
          width: 100%;
          max-width: 780px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .history-modal-header {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
          border-bottom: 2px solid rgba(245, 158, 11, 0.3);
          padding: 20px 24px 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .history-modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: #e2e8f0;
          font-size: 14px;
          line-height: 1.65;
        }
        .history-modal-photo-wrapper {
          position: relative;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #090d16;
          border: 2px solid rgba(245, 158, 11, 0.45);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
        }
        .history-photo-badge {
          position: absolute;
          bottom: 10px;
          right: 12px;
          background: rgba(15, 23, 42, 0.88);
          border: 1px solid rgba(245, 158, 11, 0.6);
          color: #fde047;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          padding: 3px 8px;
          border-radius: 6px;
          backdrop-filter: blur(4px);
        }
        .history-modal-footer {
          background: linear-gradient(0deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.85) 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Historical Landmark Description Photo Showcase */
        .history-desc-photos {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
          margin-top: 4px;
        }
        .history-desc-photos-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 900;
          color: #fbbf24;
          letter-spacing: 0.8px;
        }
        .history-photo-card {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          background: #080d1a;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }
        .history-photo-card img {
          width: 100%;
          height: auto;
          max-height: 220px;
          object-fit: cover;
          display: block;
          transition: transform 0.35s ease, filter 0.3s ease;
        }
        .history-photo-card:hover img {
          transform: scale(1.015);
        }
        .history-photo-meta {
          padding: 10px 14px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .history-photo-caption {
          font-size: 12.5px;
          color: #f1f5f9;
          line-height: 1.5;
          font-weight: 500;
        }
        .history-photo-credit {
          font-size: 10.5px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }
        .history-photo-credit-badge {
          background: rgba(245, 158, 11, 0.18);
          color: #fbbf24;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 9.5px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .history-photo-thumbs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-top: 2px;
        }
        .history-photo-thumb {
          width: 68px;
          height: 46px;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          opacity: 0.65;
          transition: all 0.2s ease;
          flex-shrink: 0;
          background: #000;
        }
        .history-photo-thumb.active, .history-photo-thumb:hover {
          opacity: 1;
          border-color: #f59e0b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }
        .history-photo-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }


        /* Toasts & Alerts */
        #hud-action-toast, #hud-rescue-toast, #hud-drift-badge, #hud-flip-alert, #hud-radar-alert {
          position: absolute;
          pointer-events: none;
        }
        #hud-action-toast {
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          display: none;
          transition: opacity 0.3s, transform 0.3s;
          z-index: 45;
        }
        #hud-action-toast.show {
          display: block;
          opacity: 1;
          transform: translateX(-50%) translateY(-10px);
        }
        #hud-rescue-toast {
          top: 100px;
          left: 50%;
          transform: translateX(-50%);
          border-color: #ef4444;
          display: none;
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s;
        }
        #hud-rescue-toast.show {
          display: block;
          opacity: 1;
        }
        #hud-flip-alert {
          top: 35%;
          left: 50%;
          transform: translateX(-50%);
          border-color: #ef4444;
          display: none;
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s;
        }
        #hud-flip-alert.show {
          display: flex;
          opacity: 1;
        }
        #hud-stuck-alert {
          position: absolute;
          top: 42%;
          left: 50%;
          transform: translateX(-50%);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 12px 20px;
          display: none;
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.96);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.8), 0 0 24px rgba(245, 158, 11, 0.45);
          z-index: 150;
          pointer-events: auto;
          cursor: pointer;
          max-width: 90vw;
          text-align: center;
        }
        #hud-stuck-alert.show {
          display: flex;
          opacity: 1;
        }
        #hud-drift-badge {
          top: 105px;
          left: 50%;
          transform: translateX(-50%) scale(0.8);
          background: linear-gradient(135deg, rgba(236,72,153,0.9), rgba(244,63,133,0.9));
          border: 2px solid #fff;
          border-radius: 10px;
          padding: 6px 18px;
          opacity: 0;
          display: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        #hud-drift-badge.show {
          display: block;
          opacity: 1;
          transform: translateX(-50%) scale(1.0);
        }

        /* Awakening Screen - Hidden & non-blocking */
        #start-awaken-screen {
          display: none !important;
          pointer-events: none !important;
        }
        #start-awaken-screen.gate-hidden {
          display: none !important;
        }
        .start-awaken-pill {
          display: none !important;
        }

        /* Clean UI Visibility */
        .hud-ui-hidden .hud-gameplay-panel {
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* 💾 Auto-Load Expedition Resume Modal & ⏸️ Pause Modal */
        .hud-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(4, 8, 16, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.25s ease, visibility 0.25s ease;
        }
        .hud-modal-backdrop.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .hud-center-modal-card {
          background: rgba(14, 20, 32, 0.96);
          border: 1.5px solid rgba(56, 189, 248, 0.4);
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85), 0 0 36px rgba(56, 189, 248, 0.2);
          padding: 28px 32px;
          width: 480px;
          max-width: calc(100vw - 36px);
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          transform: translateY(-16px) scale(0.96);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }
        .hud-modal-backdrop.open .hud-center-modal-card {
          transform: translateY(0) scale(1);
        }
        .resume-card-header, .pause-card-header {
          text-align: center;
          margin-bottom: 18px;
        }
        .resume-card-badge {
          display: inline-block;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .pause-card-badge {
          display: inline-block;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #0f172a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .resume-card-title, .pause-card-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #f8fafc;
          margin-bottom: 4px;
        }
        .resume-card-zone, .pause-card-zone {
          font-size: 14px;
          font-weight: 800;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .resume-card-coord {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 3px;
        }
        .resume-card-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 8px;
          margin-bottom: 18px;
          text-align: center;
        }
        .resume-stat-pill .stat-lbl {
          display: block;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #94a3b8;
          margin-bottom: 3px;
        }
        .resume-stat-pill .stat-num {
          display: block;
          font-size: 14px;
          font-weight: 900;
          color: #facc15;
        }
        .resume-card-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 14px;
        }
        .resume-hero-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 14px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.15s ease, filter 0.15s ease, background 0.15s ease;
          border: none;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
        }
        .resume-hero-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.12);
        }
        .resume-hero-btn .btn-main-text {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }
        .resume-hero-btn .btn-sub-text {
          font-size: 11px;
          opacity: 0.85;
          margin-top: 2px;
        }
        .resume-btn-drive {
          background: linear-gradient(135deg, #10b981 0%, #047857 100%);
          color: #ffffff;
          box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35);
        }
        .resume-btn-fresh {
          background: rgba(239, 68, 68, 0.14);
          border: 1.5px solid rgba(239, 68, 68, 0.45);
          color: #fca5a5;
        }
        .resume-btn-fresh:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: #ef4444;
        }
        .resume-card-hint {
          text-align: center;
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }

        /* Pause Menu Buttons */
        .pause-card-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }
        .pause-menu-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
          border: none;
          color: #fff;
          transition: transform 0.15s ease, filter 0.15s ease, background 0.15s ease;
        }
        .pause-menu-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.12);
        }
        .pause-menu-btn .btn-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        .pause-menu-btn .btn-label-block {
          display: flex;
          flex-direction: column;
        }
        .pause-menu-btn .btn-title {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }
        .pause-menu-btn .btn-desc {
          font-size: 11px;
          opacity: 0.8;
          margin-top: 2px;
        }
        .pause-btn-primary {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          box-shadow: 0 4px 18px rgba(2, 132, 199, 0.35);
        }
        .pause-btn-accent {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          box-shadow: 0 4px 18px rgba(139, 92, 246, 0.35);
        }
        .pause-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .pause-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .pause-btn-danger {
          background: rgba(239, 68, 68, 0.14);
          border: 1.5px solid rgba(239, 68, 68, 0.45);
          color: #fca5a5;
        }
        .pause-btn-danger:hover {
          background: rgba(239, 68, 68, 0.28);
          border-color: #ef4444;
        }
        .pause-card-footer {
          text-align: center;
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 12px;
        }

        /* 🏔️ 4x4 Off-Road Telemetry & Inclinometer Modal Overlay */
        #hud-offroad-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(4, 8, 16, 0.62);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          z-index: 119;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.25s ease, visibility 0.25s ease;
        }
        #hud-offroad-backdrop.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        #hud-offroad-cluster {
          position: fixed;
          top: 72px;
          right: 28px;
          width: 320px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 90px);
          overflow-y: auto;
          background: rgba(14, 18, 24, 0.96);
          border: 1.5px solid rgba(245, 158, 11, 0.55);
          border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 24px rgba(245, 158, 11, 0.25);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 12px 14px;
          pointer-events: none;
          z-index: 120;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px) scale(0.96);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s ease;
        }
        #hud-offroad-cluster.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }
        #hud-offroad-cluster.on-trail {
          border-color: #f59e0b;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85), 0 0 32px rgba(245, 158, 11, 0.4);
        }
        @media (max-width: 920px), (hover: none), (pointer: coarse) {
          #hud-offroad-cluster {
            top: 50% !important;
            left: 50% !important;
            right: auto !important;
            bottom: auto !important;
            width: calc(100vw - 36px) !important;
            max-width: 330px !important;
            transform: translate(-50%, -50%) scale(0.94) !important;
          }
          #hud-offroad-cluster.open {
            transform: translate(-50%, -50%) scale(1) !important;
          }
        }
        .telemetry-close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .telemetry-close-btn:hover {
          background: rgba(239, 68, 68, 0.35);
          border-color: #ef4444;
          color: #fff;
          transform: scale(1.1);
        }
        .offroad-cluster-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .offroad-title {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #f59e0b;
        }
        .trail-stage-badge {
          font-size: 9px;
          font-weight: 800;
          background: rgba(245, 158, 11, 0.18);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #fbbf24;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .inclinometer-container {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }
        .gauge-box {
          flex: 1;
          background: rgba(2, 6, 12, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 6px;
          text-align: center;
        }
        .gauge-label {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .gauge-viewport {
          position: relative;
          width: 58px;
          height: 58px;
          margin: 0 auto;
          border-radius: 50%;
          overflow: hidden;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          background: #0f172a;
        }
        .horizon-disc {
          position: absolute;
          top: -20px; left: -20px; width: 98px; height: 98px;
          border-radius: 50%;
          transform-origin: center center;
          transition: transform 0.05s linear;
        }
        .horizon-sky {
          width: 100%; height: 50%;
          background: linear-gradient(180deg, #1e3a5f 0%, #38bdf8 100%);
        }
        .horizon-ground {
          width: 100%; height: 50%;
          background: linear-gradient(180deg, #854d0e 0%, #451a03 100%);
        }
        .horizon-line {
          position: absolute;
          top: 49px; left: 0; width: 100%; height: 2px;
          background: #fde047;
          box-shadow: 0 0 4px #fde047;
        }
        .gauge-reticle {
          position: absolute;
          top: 50%; left: 50%;
          width: 12px; height: 12px;
          border: 1.5px solid #ffffff;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .gauge-reticle::before, .gauge-reticle::after {
          content: ''; position: absolute; background: #ffffff;
        }
        .gauge-reticle::before { top: 5px; left: -10px; width: 8px; height: 1.5px; }
        .gauge-reticle::after { top: 5px; right: -10px; width: 8px; height: 1.5px; }
        .pitch-ladder {
          position: relative;
          width: 100%; height: 100%;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        }
        .pitch-tick {
          position: absolute; width: 100%; text-align: center;
          font-size: 8px; font-weight: 700; color: #64748b;
          transform: translateY(-50%);
        }
        .pitch-tick.center-tick { color: #fde047; font-weight: 900; }
        .pitch-bubble {
          position: absolute;
          top: 50%; left: 50%; width: 14px; height: 14px;
          background: radial-gradient(circle, #fde047 30%, #d97706 100%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.8);
          transition: transform 0.05s linear;
        }
        .gauge-val {
          font-size: 13px;
          font-weight: 900;
          color: #f8fafc;
          margin-top: 4px;
          font-family: 'Consolas', monospace;
        }
        .offroad-metrics-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          gap: 6px;
        }
        .metric-col {
          display: flex;
          flex-direction: column;
        }
        .metric-label {
          font-size: 8px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .metric-num {
          font-size: 12px;
          font-weight: 800;
          color: #38bdf8;
          font-family: 'Consolas', monospace;
        }
        .btn-4x4-pill {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          border: 1px solid #fde047;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 6px rgba(217, 119, 6, 0.4);
          transition: all 0.15s ease;
        }
        .btn-4x4-pill:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .btn-4x4-pill:active {
          transform: scale(0.96);
        }
        .drivetrain-mode-badge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(2, 6, 12, 0.7);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 6px;
          padding: 3px 8px;
          margin-top: 6px;
          cursor: pointer;
          pointer-events: auto;
        }
        .mode-val {
          font-size: 10px;
          font-weight: 900;
          color: #fde047;
          letter-spacing: 0.5px;
        }
        .lock-indicator {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
        }
        .rollover-hazard {
          display: none;
          background: rgba(239, 68, 68, 0.92);
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5px;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
          margin-top: 6px;
          animation: pulse-hazard 0.8s infinite alternate;
        }
        @keyframes pulse-hazard {
          from { opacity: 0.8; transform: scale(0.98); }
          to { opacity: 1.0; transform: scale(1.02); }
        }
        .spotter-ticker {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.75);
          border-radius: 6px;
          padding: 4px 6px;
          margin-top: 6px;
          font-size: 9px;
          color: #cbd5e1;
          line-height: 1.25;
        }
        .spotter-radio-icon {
          font-size: 12px;
          flex-shrink: 0;
        }

        /* 📺 YouTube Music Tablet App & In-Car Infotainment CSS */
        #youtube-persistent-container {
          position: fixed;
          border: none;
          box-sizing: border-box;
        }
        #youtube-persistent-container iframe,
        #youtube-persistent-container > div {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          display: block !important;
        }
        #youtube-persistent-container.yt-driving-mode,
        #youtube-persistent-container.yt-driving-dock {
          position: fixed !important;
          bottom: 0px !important;
          right: 0px !important;
          width: 240px !important;
          height: 180px !important;
          opacity: 0.005 !important;
          pointer-events: none !important;
          z-index: 1 !important;
          background: #000;
          clip-path: none !important;
          overflow: hidden !important;
        }
        #youtube-persistent-container.yt-tablet-mode {
          position: fixed !important;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.7);
          z-index: 350 !important;
        }
        #youtube-persistent-container.yt-tablet-hidden {
          position: fixed !important;
          bottom: 0px !important;
          right: 0px !important;
          width: 240px !important;
          height: 180px !important;
          opacity: 0.005 !important;
          pointer-events: none !important;
          z-index: 1 !important;
          clip-path: none !important;
          overflow: hidden !important;
        }

        /* Tablet YouTube View Layout */
        .yt-app-header {
          background: linear-gradient(90deg, rgba(220, 38, 38, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%);
          border-bottom: 2px solid rgba(239, 68, 68, 0.35);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          gap: 6px;
          flex-shrink: 0;
          box-sizing: border-box;
          width: 100%;
        }
        .yt-app-header .tablet-nav-left {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          flex-shrink: 1;
        }
        .yt-nav-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .yt-header-badge {
          background: #ff0000;
          color: #fff;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.5px;
          padding: 3px 6px;
          border-radius: 6px;
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
          white-space: nowrap;
        }
        .yt-header-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          white-space: nowrap;
        }
        .yt-live-pill {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid #22c55e;
          color: #4ade80;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .yt-drive-btn {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #ffffff;
          border: 1px solid #4ade80;
          font-size: 11px;
          font-weight: 900;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
          transition: transform 0.15s ease, background 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .yt-drive-btn:hover {
          transform: translateY(-1px);
          background: linear-gradient(135deg, #4ade80, #22c55e);
        }
        .yt-drive-btn:active {
          transform: translateY(1px);
        }

        /* Mobile Responsive Overrides for YouTube App */
        @media (max-width: 768px), (hover: none), (pointer: coarse) {
          .yt-header-sub {
            display: none !important;
          }
          .yt-live-pill {
            display: none !important;
          }
          .yt-header-badge {
            font-size: 10px !important;
            padding: 2px 5px !important;
          }
          .yt-app-header .tablet-back-btn {
            padding: 5px 8px !important;
            font-size: 10px !important;
          }
          .yt-drive-btn {
            padding: 5px 8px !important;
            font-size: 10px !important;
          }
        }

        /* Fixed Mobile Bottom Bar in Tablet */
        .yt-mobile-drive-bar {
          display: none;
          padding: 10px 14px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(4, 8, 16, 0.98) 100%);
          border-top: 2px solid rgba(34, 197, 94, 0.4);
          backdrop-filter: blur(10px);
          flex-shrink: 0;
          z-index: 10;
          box-sizing: border-box;
          width: 100%;
        }
        @media (max-width: 768px), (hover: none), (pointer: coarse) {
          .yt-mobile-drive-bar {
            display: block;
          }
        }
        .yt-drive-btn-mobile {
          width: 100%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #ffffff;
          border: 1.5px solid #4ade80;
          font-size: 13px;
          font-weight: 900;
          padding: 11px 16px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.45);
          letter-spacing: 0.5px;
          transition: transform 0.1s ease;
        }
        .yt-drive-btn-mobile:active {
          transform: scale(0.98);
        }

        .yt-scroll-container {
          flex: 1 1 0%;
          min-height: 0;
          padding: 14px 18px 24px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
        }

        /* Search Bar */
        .yt-search-wrapper {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .yt-search-input-box {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.75);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 0 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .yt-search-input-box:focus-within {
          border-color: #ef4444;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.35);
        }
        .yt-search-icon {
          font-size: 16px;
          color: #94a3b8;
          margin-right: 8px;
        }
        #yt-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 0;
        }
        #yt-search-input::placeholder {
          color: #64748b;
        }
        .yt-search-clear {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
        }
        .yt-search-clear:hover {
          color: #fff;
        }
        .yt-btn-search {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          border: 1px solid #f87171;
          font-size: 12px;
          font-weight: 800;
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
          transition: transform 0.15s ease, filter 0.15s ease;
        }
        .yt-btn-search:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }

        /* Genre filter chips */
        .yt-genre-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
        }
        .yt-genre-tab {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .yt-genre-tab:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(51, 65, 85, 0.8);
        }
        .yt-genre-tab.active {
          background: #ef4444;
          color: #fff;
          border-color: #f87171;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.45);
        }

        /* Now Playing Hero Deck */
        .yt-now-playing-deck {
          background: linear-gradient(135deg, rgba(20, 26, 38, 0.95), rgba(10, 14, 22, 0.95));
          border: 1.5px solid rgba(239, 68, 68, 0.35);
          border-radius: 16px;
          padding: 14px;
          display: flex;
          gap: 16px;
          align-items: center;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
        }
        .yt-deck-screen-area {
          position: relative;
          width: 240px;
          height: 135px;
          border-radius: 10px;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.15);
          overflow: hidden;
          flex-shrink: 0;
        }
        .yt-dock-target {
          width: 100%;
          height: 100%;
        }
        .yt-deck-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .yt-deck-status-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .yt-audio-spectrum {
          display: inline-flex;
          align-items: flex-end;
          gap: 2px;
          height: 14px;
        }
        .yt-audio-spectrum span {
          width: 3px;
          height: 100%;
          background: #ef4444;
          border-radius: 1px;
          animation: ytEqBar 0.8s infinite ease-in-out alternate;
        }
        .yt-audio-spectrum span:nth-child(2) { animation-delay: 0.15s; }
        .yt-audio-spectrum span:nth-child(3) { animation-delay: 0.3s; }
        .yt-audio-spectrum span:nth-child(4) { animation-delay: 0.45s; }
        .yt-audio-spectrum span:nth-child(5) { animation-delay: 0.6s; }
        @keyframes ytEqBar {
          0% { height: 20%; opacity: 0.4; }
          100% { height: 100%; opacity: 1; }
        }
        .yt-playing-badge {
          font-size: 10px;
          font-weight: 800;
          color: #f87171;
          letter-spacing: 0.5px;
        }
        .yt-deck-ext-btn {
          margin-left: auto;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #94a3b8;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          padding: 2px 8px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .yt-deck-ext-btn:hover {
          color: #ffffff;
          background: #ef4444;
          border-color: #ef4444;
        }
        .yt-deck-title {
          font-size: 18px;
          font-weight: 900;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yt-deck-artist {
          font-size: 13px;
          font-weight: 700;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yt-deck-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }
        .yt-ctrl-btn {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          font-size: 14px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .yt-ctrl-btn:hover {
          background: rgba(51, 65, 85, 0.9);
          transform: scale(1.06);
        }
        .yt-btn-play-large {
          background: #ef4444;
          border-color: #f87171;
          width: 40px;
          height: 40px;
          font-size: 16px;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
        }
        .yt-btn-play-large:hover {
          background: #dc2626;
        }
        .yt-volume-box {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 8px;
        }
        .yt-ctrl-btn-mini {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          cursor: pointer;
        }
        .yt-range {
          width: 75px;
          accent-color: #ef4444;
          cursor: pointer;
        }

        /* Custom Search Result Card */
        .yt-custom-search-card {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(30, 41, 59, 0.6));
          border: 1.5px solid #ef4444;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 4px 18px rgba(239, 68, 68, 0.25);
        }
        .yt-custom-search-icon {
          font-size: 24px;
          color: #ef4444;
        }
        .yt-custom-search-text {
          flex: 1;
        }
        .yt-custom-search-title {
          font-size: 14px;
          font-weight: 800;
          color: #fff;
        }
        .yt-custom-search-sub {
          font-size: 11px;
          color: #94a3b8;
        }
        .yt-custom-search-play-btn {
          background: #ef4444;
          color: #fff;
          border: none;
          font-size: 11px;
          font-weight: 900;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);
        }
        .yt-custom-search-play-btn:hover {
          background: #dc2626;
        }

        /* Track Grid */
        .yt-catalog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 800;
          color: #f87171;
          margin-top: 4px;
        }
        .yt-track-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .yt-track-card {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .yt-track-card:hover {
          transform: translateY(-2px);
          border-color: #ef4444;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(239, 68, 68, 0.3);
          background: rgba(30, 41, 59, 0.85);
        }
        .yt-track-card.active {
          border-color: #ef4444;
          background: rgba(220, 38, 38, 0.18);
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.4);
        }
        .yt-track-thumb-box {
          position: relative;
          width: 100%;
          height: 110px;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
        }
        .yt-track-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .yt-track-duration {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 4px;
        }
        .yt-track-tag {
          position: absolute;
          top: 4px;
          left: 4px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          color: #facc15;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .yt-track-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .yt-track-meta {
          min-width: 0;
          flex: 1;
        }
        .yt-track-title {
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yt-track-artist {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yt-track-play-badge {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid #ef4444;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 8px;
          flex-shrink: 0;
        }
        .yt-track-card:hover .yt-track-play-badge {
          background: #ef4444;
          color: #fff;
        }

        /* 📻 In-Car Highway Stereo Head Unit HUD Widget (Active while driving) */
        #youtube-car-stereo {
          position: fixed;
          top: 14px;
          right: 200px;
          z-index: 150;
          pointer-events: auto;
          display: flex;
          align-items: center;
        }
        .yt-stereo-body {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(4, 8, 16, 0.98));
          border: 2px solid rgba(239, 68, 68, 0.5);
          border-radius: 12px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(239, 68, 68, 0.25);
          backdrop-filter: blur(10px);
        }
        .yt-stereo-badge {
          background: #ff0000;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          padding: 3px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.6);
          cursor: pointer;
        }
        .yt-stereo-display {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 170px;
          overflow: hidden;
          cursor: pointer;
        }
        .yt-stereo-marquee-wrap {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }
        .yt-stereo-marquee {
          font-size: 12px;
          font-weight: 800;
          color: #ffffff;
          display: inline-block;
          animation: ytMarquee 10s linear infinite;
        }
        @keyframes ytMarquee {
          0% { transform: translateX(0%); }
          50% { transform: translateX(-40%); }
          100% { transform: translateX(0%); }
        }
        .yt-stereo-bars {
          display: flex;
          gap: 2px;
          align-items: flex-end;
          height: 8px;
        }
        .yt-stereo-bars i {
          width: 2px;
          height: 100%;
          background: #38bdf8;
          border-radius: 1px;
          animation: ytEqBar 0.7s infinite alternate ease-in-out;
        }
        .yt-stereo-bars i:nth-child(2) { animation-delay: 0.15s; background: #22c55e; }
        .yt-stereo-bars i:nth-child(3) { animation-delay: 0.3s; background: #ef4444; }
        .yt-stereo-bars i:nth-child(4) { animation-delay: 0.45s; background: #facc15; }
        .yt-stereo-bars i:nth-child(5) { animation-delay: 0.6s; background: #ec4899; }
        .yt-stereo-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .yt-stereo-btn {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          font-size: 12px;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .yt-stereo-btn:hover {
          background: #ef4444;
          border-color: #f87171;
          transform: scale(1.05);
        }
        .yt-stereo-tab-btn {
          width: auto;
          padding: 0 8px;
          font-size: 10px;
          font-weight: 800;
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.4);
        }
        .yt-stereo-tab-btn:hover {
          background: #0284c7;
          border-color: #38bdf8;
          color: #fff;
        }
        .yt-stereo-btn-mini {
          background: none;
          border: none;
          color: #64748b;
          font-size: 12px;
          cursor: pointer;
          padding: 2px;
        }
        .yt-stereo-btn-mini:hover {
          color: #ef4444;
        }
      </style>

      <!-- 3D Fellow Player Floating Nametags -->
      <div id="fellow-player-tags-container"></div>

      <!-- 📻 In-Car Highway Stereo Head Unit HUD Widget (Active while driving) -->
      <div id="youtube-car-stereo" class="yt-stereo-widget" style="display: none;">
        <div class="yt-stereo-body">
          <div class="yt-stereo-badge">
            <span>▶</span> YT MUSIC
          </div>
          <div class="yt-stereo-display">
            <div class="yt-stereo-marquee-wrap">
              <div class="yt-stereo-marquee" id="yt-stereo-text">Kavinsky - Nightcall</div>
            </div>
            <div class="yt-stereo-bars" id="yt-stereo-bars">
              <i></i><i></i><i></i><i></i><i></i>
            </div>
          </div>
          <div class="yt-stereo-actions">
            <button class="yt-stereo-btn" id="yt-stereo-play-btn" title="Play / Pause">▶</button>
            <button class="yt-stereo-btn" id="yt-stereo-mute-btn" title="Mute">🔊</button>
            <button class="yt-stereo-btn yt-stereo-tab-btn" id="yt-stereo-tablet-btn" title="Open In-Car Digital Tablet OS [TAB]">📱 TABLET</button>
            <button class="yt-stereo-btn-mini" id="yt-stereo-close-btn" title="Hide Stereo Widget">✕</button>
          </div>
        </div>
      </div>

      <!-- Top Driving Status Bar: Pause Menu -->
      <div id="hud-top-bar" class="hud-gameplay-panel">
        <button id="hud-pause-btn" class="hud-top-btn" title="Pause Expedition & Options [ESC]">⏸️ MENU</button>
      </div>

      <!-- Driving Speedometer, Nitro & Health Panel -->
      <div id="hud-speedometer" class="hud-panel hud-gameplay-panel">
        <div style="display: flex; align-items: baseline; justify-content: flex-end; gap: 4px;">
          <span id="speed-val" class="speed-val">00</span>
          <span class="speed-unit">MPH</span>
        </div>
        
        <!-- 4x4 Drivetrain Mode Badge (Click/Tap to Open Telemetry & Shift) -->
        <div id="hud-4x4-badge" class="drivetrain-mode-badge" title="Tap to Open 4x4 Telemetry & Inclinometer">
          <span id="drivetrain-mode-val" class="mode-val">2H HIGHWAY</span>
          <span id="drivetrain-lock-indicator" class="lock-indicator">OPEN DIFF</span>
        </div>

        <div class="bar-container">
          <div class="bar-label"><span>NITRO</span><span id="nitro-pct">100%</span></div>
          <div class="bar-track"><div id="nitro-bar" class="bar-fill-nitro"></div></div>
        </div>

        <div class="bar-container" style="margin-top: 6px;">
          <div class="bar-label"><span>HEALTH</span><span id="integrity-val">100%</span></div>
          <div class="bar-track"><div id="integrity-bar" class="bar-fill-integrity"></div></div>
        </div>
      </div>

      <!-- 🏔️ 4x4 Off-Road Telemetry Modal Backdrop & Overlay -->
      <div id="hud-offroad-backdrop"></div>
      <div id="hud-offroad-cluster" class="hud-panel hud-gameplay-panel">
        <div class="offroad-cluster-header">
          <div class="offroad-title"><span>🏔️ 4x4 ADVENTURE TELEMETRY</span></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div id="trail-stage-badge" class="trail-stage-badge">HIGHWAY 1</div>
            <button id="telemetry-close-btn" class="telemetry-close-btn" title="Close Telemetry [✕ / ESC]">✕</button>
          </div>
        </div>

        <!-- Dual Pitch & Roll Inclinometer Gauge -->
        <div class="inclinometer-container">
          <!-- Roll Gauge (Horizon Tilt) -->
          <div class="gauge-box">
            <div class="gauge-label">ROLL (LEAN)</div>
            <div class="gauge-viewport">
              <div id="inclinometer-roll-disc" class="horizon-disc">
                <div class="horizon-sky"></div>
                <div class="horizon-ground"></div>
                <div class="horizon-line"></div>
              </div>
              <div class="gauge-reticle"></div>
            </div>
            <div id="inclinometer-roll-val" class="gauge-val">0.0°</div>
          </div>

          <!-- Pitch Gauge (Incline / Decline) -->
          <div class="gauge-box">
            <div class="gauge-label">PITCH (GRADE)</div>
            <div class="gauge-viewport">
              <div id="inclinometer-pitch-ladder" class="pitch-ladder">
                <div class="pitch-tick" style="top: 15%;">+20°</div>
                <div class="pitch-tick center-tick" style="top: 50%;">0°</div>
                <div class="pitch-tick" style="top: 85%;">-20°</div>
                <div id="pitch-bubble" class="pitch-bubble"></div>
              </div>
            </div>
            <div id="inclinometer-pitch-val" class="gauge-val">0.0°</div>
          </div>
        </div>

        <!-- Altimeter & Grade Details -->
        <div class="offroad-metrics-row">
          <div class="metric-col">
            <span class="metric-label">ELEVATION</span>
            <span id="altimeter-val" class="metric-num">0 FT</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">SLOPE GRADE</span>
            <span id="grade-val" class="metric-num">0%</span>
          </div>
          <div class="metric-col">
            <span class="metric-label">DRIVE MODE</span>
            <button id="btn-toggle-4x4" class="btn-4x4-pill" title="Cycle Drive Mode [Key X]">[ 2H ]</button>
          </div>
        </div>

        <!-- Rollover Warning Banner (hidden until roll > 30°) -->
        <div id="rollover-hazard-banner" class="rollover-hazard">⚠️ ROLLOVER DANGER • LEVEL VEHICLE</div>

        <!-- Spotter Radio Advice Ticker -->
        <div id="spotter-radio-ticker" class="spotter-ticker">
          <span class="spotter-radio-icon">📻</span>
          <span id="spotter-radio-text">Standard highway driving. Cougar Ridge trailhead ahead at Z=1000m.</span>
        </div>
      </div>

      <!-- Prominent Center-Top Scenic Highway Discovery Banner -->
      <div id="hud-scenic-waypoint" class="hud-gameplay-panel" title="Scenic Highway Turnout Ahead • Click to Slow & Pull Over">
        <div class="scenic-banner-content">
          <div class="scenic-waypoint-left">
            <div class="scenic-waypoint-badge">
              <span class="scenic-waypoint-icon" id="scenic-waypoint-icon">🏞️</span>
            </div>
            <div class="scenic-waypoint-info">
              <div class="scenic-waypoint-tagline">
                <span class="scenic-tag-badge">★ SCENIC BYWAY DISCOVERY</span>
                <span id="scenic-exit-side" class="scenic-exit-indicator">EXIT RIGHT ↗</span>
              </div>
              <div class="scenic-waypoint-name" id="scenic-lot-name">Scenic Overlook</div>
              <div class="scenic-waypoint-sub" id="scenic-lot-sub">Historic Coastal Vista & Heritage Plaque</div>
            </div>
          </div>
          <div class="scenic-waypoint-right">
            <button id="scenic-waypoint-close" class="scenic-banner-close" aria-label="Dismiss banner" title="Dismiss">✕</button>
            <div class="scenic-dist-badge">
              <span class="scenic-dist-num" id="scenic-lot-dist">280</span><span class="scenic-dist-unit" id="scenic-lot-unit">m</span>
            </div>
          </div>
        </div>
        <div class="scenic-action-hint-bar">
          <div class="scenic-action-hint" id="scenic-action-hint">SLOW DOWN &bull; PREPARE TO EXIT</div>
        </div>
        <div class="scenic-progress-track">
          <div class="scenic-progress-bar" id="scenic-progress-bar"></div>
        </div>
      </div>

      <!-- Prominent Wrong Gear Alert Banner -->
      <div id="hud-gear-alert" class="hud-gameplay-panel" role="alert" aria-live="assertive" title="Wrong Gearbox Mode! Click or Press [SPACE] to Shift">
        <div class="gear-alert-icon" id="gear-alert-icon">⚠️</div>
        <div class="gear-alert-content">
          <div class="gear-alert-title">
            <span id="gear-alert-title-text">SHIFT TO LOW GEAR</span>
            <span class="gear-alert-key-hint" id="gear-alert-key">[SPACE]</span>
          </div>
          <div class="gear-alert-subtitle" id="gear-alert-subtitle-text">Rock crawl trail requires Low Range crawl torque</div>
        </div>
      </div>

      <!-- Historical Plaque Prompt Pill -->
      <div id="hud-history-prompt-pill">
        <span style="font-size: 22px;">📖</span>
        <div>
          <div class="history-prompt-header" id="history-prompt-header">★ HISTORICAL LANDMARK ★</div>
          <div class="history-prompt-name" id="history-prompt-name">Historic Landmark</div>
        </div>
        <div class="history-prompt-action" id="history-prompt-action">READ <span class="history-key-hint">[E]</span></div>
      </div>

      <!-- Scenic Binoculars Interaction Prompt Pill -->
      <div id="hud-binocular-prompt-pill">
        <span style="font-size: 22px;">👁️</span>
        <div>
          <div class="binocular-prompt-header">★ SCENIC OVERLOOK ★</div>
          <div class="binocular-prompt-name" id="binocular-prompt-name">Scenic Binoculars</div>
        </div>
        <div class="binocular-prompt-action">LOOK <span class="bino-key-hint">[E]</span></div>
      </div>

      <!-- 📱 IN-CAR DIGITAL TABLET OS MODAL -->
      <div id="hud-tablet-modal">
        <div class="tablet-device">
          <!-- Tablet Top Status Bar -->
          <div class="tablet-status-bar">
            <div class="tablet-status-left">
              <span class="tablet-brand">📱 BAJA RACER OS</span>
              <span id="tablet-clock">12:00 PM</span>
              <span class="tablet-status-zone" id="tablet-status-zone">ZONE 0: MOJAVE</span>
            </div>
            <div class="tablet-status-right">
              <span>5G 📶 • 100% 🔋</span>
              <button class="tablet-close-btn" id="tablet-close-btn" title="Close Tablet [TAB / ESC]">✕</button>
            </div>
          </div>

          <!-- Tablet Screen Body -->
          <div class="tablet-body">
            <!-- 1. Home Launcher View -->
            <div class="tablet-view active" id="tab-view-home">
              <div class="tablet-home-container">
                <div class="tablet-welcome-bar">
                  <div>
                    <div class="tablet-welcome-title">SAFARI EXPEDITION JEEP 4x4 &bull; COCKPIT DASHBOARD</div>
                    <div class="tablet-welcome-sub">Pacific Coast Highway Overland Suite & Controls</div>
                  </div>
                  <div style="font-size: 12px; font-weight: 800; color: #38bdf8;">ROAD READY</div>
                </div>

                <div class="tablet-app-grid">
                  <!-- App 1: YouTube App (featured, at top of list) -->
                  <div class="tablet-app-card" data-open-app="youtube" id="tablet-card-youtube">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #ff0000, #990000);">
                      <span style="font-size: 18px; color: #fff;">▶️</span>
                    </div>
                    <div class="tablet-app-name">YouTube</div>
                    <div class="tablet-app-tag" id="tab-app-tag-youtube">Stream road songs & search YouTube</div>
                  </div>

                  <!-- App 2: Milestones & GPS Map -->
                  <div class="tablet-app-card" data-open-app="milestones">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #f59e0b, #ea580c);">🗺️</div>
                    <div class="tablet-app-name">Milestones & GPS Map</div>
                    <div class="tablet-app-tag">Live radar map & route tracker</div>
                  </div>


                  <!-- App 4: Optics & Camera -->
                  <div class="tablet-app-card" data-open-app="camera">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #8b5cf6, #6366f1);">🎥</div>
                    <div class="tablet-app-name">Optics & Camera</div>
                    <div class="tablet-app-tag">Chase, cockpit, hood & photo</div>
                  </div>

                  <!-- App 5: Weather & Climate -->
                  <div class="tablet-app-card" data-open-app="weather">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #06b6d4, #0284c7);">🌧️</div>
                    <div class="tablet-app-name">Weather & Climate</div>
                    <div class="tablet-app-tag">Auto, sunny skies, rain & fog</div>
                  </div>

                  <!-- App 6: Livery & Paint -->
                  <div class="tablet-app-card" data-open-app="livery">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #ec4899, #f43f5e);">🎨</div>
                    <div class="tablet-app-name">Paint & Livery</div>
                    <div class="tablet-app-tag">Safari Jeep 4x4 overland paint studio</div>
                  </div>

                  <!-- App 7: Diagnostics & Reset -->
                  <div class="tablet-app-card" data-open-app="diagnostics">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #10b981, #059669);">🔧</div>
                    <div class="tablet-app-name">Diagnostics & Reset</div>
                    <div class="tablet-app-tag">Respawn on road, repair & tow</div>
                  </div>

                  <!-- App 8: Telemetry & FPS -->
                  <div class="tablet-app-card" data-open-app="perf">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">📊</div>
                    <div class="tablet-app-name">System Telemetry</div>
                    <div class="tablet-app-tag">Live FPS, GPU stats & presets</div>
                  </div>

                  <!-- App 9: Pacific Lore -->
                  <div class="tablet-app-card" data-open-app="lore">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #d97706, #b45309);">📖</div>
                    <div class="tablet-app-name">Heritage Field Guide</div>
                    <div class="tablet-app-tag">Historical archives & landmarks</div>
                  </div>

                  <!-- App 10: 4x4 Off-Road Inclinometer -->
                  <div class="tablet-app-card" data-open-app="offroad-telemetry">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #f59e0b, #b45309);">🏔️</div>
                    <div class="tablet-app-name">4x4 Inclinometer</div>
                    <div class="tablet-app-tag">Pitch, roll, altimeter & 4WD lockers</div>
                  </div>

                  <!-- App 11: Mystery Case Files -->
                  <div class="tablet-app-card" data-open-app="casefiles" id="tablet-card-casefiles">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #ef4444, #7f1d1d);">🕵️</div>
                    <div class="tablet-app-name">Mystery Case Files</div>
                    <div class="tablet-app-tag" id="tab-app-tag-casefiles">Mob hit investigation & evidence</div>
                  </div>

                  <!-- App 12: Save & Progress -->
                  <div class="tablet-app-card" data-open-app="savegame" id="tablet-card-savegame">
                    <div class="tablet-app-icon-wrap" style="background: linear-gradient(135deg, #10b981, #047857);">💾</div>
                    <div class="tablet-app-name">Save & Progress</div>
                    <div class="tablet-app-tag" id="tab-app-tag-savegame">Local browser save, export & reset</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Milestones & Route GPS App View -->
            <div class="tablet-view" id="tab-view-milestones">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">🗺️ PACIFIC HIGHWAY 1 &bull; MILESTONES & GPS MAP</div>
                </div>
                <div style="font-size: 11px; color: #ffd152; font-weight: 800;" id="tab-milestone-status">ZONE 0 ACTIVE</div>
              </div>
              <div class="tablet-scroll-body">
                <div class="milestone-hero-card">
                  <div>
                    <div class="milestone-zone-tag" id="tab-milestone-zone-num">ZONE 0</div>
                    <div class="milestone-hero-title" id="tab-milestone-zone-name">SOUTHERN CALIFORNIA DESERT</div>
                    <div class="milestone-hero-sub" id="tab-milestone-zone-sub">Mojave Desert & Route 66</div>
                  </div>
                  <div class="milestone-hero-right">
                    <div class="milestone-temp-badge" id="tab-milestone-temp">☀️ 104°F</div>
                    <div class="milestone-dist-badge" id="tab-milestone-dist">0.0 km / 23.4 km</div>
                  </div>
                </div>

                <div class="tab-gps-grid">
                  <!-- Left: Live GPS Radar Map -->
                  <div class="tab-radar-card">
                    <div style="font-size: 12px; font-weight: 900; color: #38bdf8; letter-spacing: 1px;">📡 LIVE HIGHWAY 1 RADAR</div>
                    <canvas id="tab-radar-canvas" width="240" height="240"></canvas>
                    <div class="tab-gps-telemetry">
                      <div class="tab-gps-telemetry-row"><span>Heading:</span><span id="tab-gps-heading" style="font-weight: 800; color: #38bdf8;">0° NORTH</span></div>
                      <div class="tab-gps-telemetry-row"><span>Surface:</span><span id="tab-gps-surface" style="font-weight: 800; color: #22c55e;">ASPHALT</span></div>
                      <div class="tab-gps-telemetry-row"><span>Coordinates:</span><span id="tab-gps-coords" style="font-weight: 800; color: #ffd152;">Z: 0.0m</span></div>
                    </div>
                  </div>

                  <!-- Right: Continuous Progress & Checkpoint Status -->
                  <div class="milestone-progress-card">
                    <div class="milestone-progress-header">
                      <span>23.4km Highway Continuous Progress</span>
                      <span id="tab-milestone-pct" style="color: #38bdf8; font-weight: 900;">0%</span>
                    </div>
                    <div class="bar-track" style="height: 10px; border-radius: 5px;">
                      <div class="bar-fill-nitro" id="tab-progress-fill" style="width: 0%; background: linear-gradient(90deg, #ec4899, #facc15, #38bdf8);"></div>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">Route Checkpoints & Zones:</div>
                    <div class="milestone-checkpoint-list" id="tab-checkpoint-list">
                      <div class="milestone-checkpoint-item" data-chk-zone="0">
                        <div class="checkpoint-left"><span class="checkpoint-icon">🏜️</span><div><div class="checkpoint-name">ZONE 0: Mojave Desert & Route 66</div><div class="checkpoint-km">0.0 - 2.6 km</div></div></div>
                        <span class="checkpoint-status-badge badge-current" id="chk-badge-0">CURRENT</span>
                      </div>
                      <div class="milestone-checkpoint-item" data-chk-zone="1">
                        <div class="checkpoint-left"><span class="checkpoint-icon">🏖️</span><div><div class="checkpoint-name">ZONE 1: Malibu & Pacific Coast Highway</div><div class="checkpoint-km">2.6 - 5.2 km</div></div></div>
                        <span class="checkpoint-status-badge badge-ahead" id="chk-badge-1">AHEAD</span>
                      </div>
                      <div class="milestone-checkpoint-item" data-chk-zone="2">
                        <div class="checkpoint-left"><span class="checkpoint-icon">🌊</span><div><div class="checkpoint-name">ZONE 2: Big Sur Highway 1 & Bixby</div><div class="checkpoint-km">5.2 - 7.8 km</div></div></div>
                        <span class="checkpoint-status-badge badge-ahead" id="chk-badge-2">AHEAD</span>
                      </div>
                      <div class="milestone-checkpoint-item" data-chk-zone="3">
                        <div class="checkpoint-left"><span class="checkpoint-icon">⛳</span><div><div class="checkpoint-name">ZONE 3: Monterey Bay & Laguna Seca</div><div class="checkpoint-km">7.8 - 10.4 km</div></div></div>
                        <span class="checkpoint-status-badge badge-ahead" id="chk-badge-3">AHEAD</span>
                      </div>
                      <div class="milestone-checkpoint-item" data-chk-zone="4">
                        <div class="checkpoint-left"><span class="checkpoint-icon">🌉</span><div><div class="checkpoint-name">ZONE 4: San Francisco & Golden Gate</div><div class="checkpoint-km">10.4 - 13.0 km</div></div></div>
                        <span class="checkpoint-status-badge badge-ahead" id="chk-badge-4">AHEAD</span>
                      </div>
                      <div class="milestone-checkpoint-item" data-chk-zone="5">
                        <div class="checkpoint-left"><span class="checkpoint-icon">🌲</span><div><div class="checkpoint-name">ZONE 5: Redwood National Forest</div><div class="checkpoint-km">13.0 - 15.6 km</div></div></div>
                        <span class="checkpoint-status-badge badge-ahead" id="chk-badge-5">AHEAD</span>
                      </div>
                      <div class="milestone-checkpoint-item" data-chk-zone="6">
                        <div class="checkpoint-left"><span class="checkpoint-icon">🌧️</span><div><div class="checkpoint-name">ZONE 6: Oregon Coastline & Haystack</div><div class="checkpoint-km">15.6 - 18.2 km</div></div></div>
                        <span class="checkpoint-status-badge badge-ahead" id="chk-badge-6">AHEAD</span>
                      </div>
                      <div class="milestone-checkpoint-item" data-chk-zone="7">
                        <div class="checkpoint-left"><span class="checkpoint-icon">💨</span><div><div class="checkpoint-name">ZONE 7: Columbia River Gorge</div><div class="checkpoint-km">18.2 - 20.8 km</div></div></div>
                        <span class="checkpoint-status-badge badge-ahead" id="chk-badge-7">AHEAD</span>
                      </div>
                      <div class="milestone-checkpoint-item" data-chk-zone="8">
                        <div class="checkpoint-left"><span class="checkpoint-icon">🗼</span><div><div class="checkpoint-name">ZONE 8: Washington & Seattle Gateway</div><div class="checkpoint-km">20.8 - 23.4 km</div></div></div>
                        <span class="checkpoint-status-badge badge-ahead" id="chk-badge-8">AHEAD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Optics & Camera App View -->
            <div class="tablet-view" id="tab-view-camera">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">🎥 OPTICS & CAMERA ANGLES</div>
                </div>
              </div>
              <div class="tablet-scroll-body">
                <div class="camera-grid">
                  <div class="camera-card" data-cam-mode="chase">
                    <div class="camera-card-icon" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">🏎️</div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff;">Dynamic Chase Camera</div>
                      <div style="font-size: 11px; color: #94a3b8;">High-speed dynamic trailing with speed FOV kick</div>
                    </div>
                  </div>
                  <div class="camera-card" data-cam-mode="cockpit">
                    <div class="camera-card-icon" style="background: rgba(234, 88, 12, 0.2); color: #f97316;">🪑</div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff;">Cockpit Driver POV</div>
                      <div style="font-size: 11px; color: #94a3b8;">Full interior view through Safari Jeep fold-down windshield</div>
                    </div>
                  </div>
                  <div class="camera-card" data-cam-mode="hood">
                    <div class="camera-card-icon" style="background: rgba(236, 72, 153, 0.2); color: #ec4899;">🏁</div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff;">Low Hood Camera</div>
                      <div style="font-size: 11px; color: #94a3b8;">Low-slung asphalt perspective for ultra-velocity sensation</div>
                    </div>
                  </div>
                  <div class="camera-card" id="btn-tab-photo-mode">
                    <div class="camera-card-icon" style="background: rgba(34, 197, 94, 0.2); color: #22c55e;">📸</div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff;">Photo Mode (360° Orbit)</div>
                      <div style="font-size: 11px; color: #94a3b8;">Drag to orbit, pinch/wheel to zoom around vehicle [P]</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. Atmosphere & Weather App View -->
            <div class="tablet-view" id="tab-view-weather">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">🌧️ ATMOSPHERE & WEATHER CONTROL</div>
                </div>
              </div>
              <div class="tablet-scroll-body">
                <div class="weather-grid">
                  <div class="weather-card" data-weather-mode="auto">
                    <div class="weather-card-icon" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">🌐</div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff;">Automatic Zone Climate</div>
                      <div style="font-size: 11px; color: #94a3b8;">Changes dynamically as you drive across Pacific biomes</div>
                    </div>
                  </div>
                  <div class="weather-card" data-weather-mode="off">
                    <div class="weather-card-icon" style="background: rgba(250, 204, 21, 0.2); color: #facc15;">☀️</div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff;">Clear Sunny Skies</div>
                      <div style="font-size: 11px; color: #94a3b8;">Optimal tire grip (100%) and clear coastal sunlight</div>
                    </div>
                  </div>
                  <div class="weather-card" data-weather-mode="on">
                    <div class="weather-card-icon" style="background: rgba(14, 165, 233, 0.2); color: #0ea5e9;">🌧️</div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff;">Pacific Rain Storm</div>
                      <div style="font-size: 11px; color: #94a3b8;">Wet asphalt reflections, tire spray roostertails & 84% grip</div>
                    </div>
                  </div>
                  <div class="weather-card" data-weather-mode="snow">
                    <div class="weather-card-icon" style="background: rgba(147, 197, 253, 0.2); color: #93c5fd;">❄️</div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff;">Alpine Snowfall</div>
                      <div style="font-size: 11px; color: #94a3b8;">Cascade Pass snow, powder spray & 70% grip (4WD recommended)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 6. Livery & Paint Studio App View -->
            <div class="tablet-view" id="tab-view-livery">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">🎨 SAFARI JEEP 4x4 OVERLAND PAINT STUDIO</div>
                </div>
                <button class="dev-tool-btn dev-btn-primary" id="btn-tab-cycle-livery">🎨 CYCLE NEXT COLOR</button>
              </div>
              <div class="tablet-scroll-body">
                <div class="livery-grid">
                  <div class="livery-card" data-paint-hex="0xc2a679" data-paint-name="Sahara Sand"><div class="livery-swatch" style="background: #c2a679;">🚙</div><div><div style="font-size:14px;font-weight:800;color:#fff;">Sahara Sand</div><div style="font-size:11px;color:#94a3b8;">Classic Desert Overland Spec</div></div></div>
                  <div class="livery-card" data-paint-hex="0x4a5840" data-paint-name="Olive Drab Safari"><div class="livery-swatch" style="background: #4a5840;">🚙</div><div><div style="font-size:14px;font-weight:800;color:#fff;">Olive Drab Safari</div><div style="font-size:11px;color:#94a3b8;">Vintage Military Trail Spec</div></div></div>
                  <div class="livery-card" data-paint-hex="0xe5a93b" data-paint-name="Golden Eagle Mustard"><div class="livery-swatch" style="background: #e5a93b;">🚙</div><div><div style="font-size:14px;font-weight:800;color:#fff;">Golden Eagle Mustard</div><div style="font-size:11px;color:#94a3b8;">1970s Golden Eagle Edition</div></div></div>
                  <div class="livery-card" data-paint-hex="0x9c412b" data-paint-name="Red Rock Canyon Rust"><div class="livery-swatch" style="background: #9c412b;">🚙</div><div><div style="font-size:14px;font-weight:800;color:#fff;">Red Rock Canyon Rust</div><div style="font-size:11px;color:#94a3b8;">Moab Slickrock Trail Spec</div></div></div>
                  <div class="livery-card" data-paint-hex="0x3c6b75" data-paint-name="Pacific Trail Blue"><div class="livery-swatch" style="background: #3c6b75;">🚙</div><div><div style="font-size:14px;font-weight:800;color:#fff;">Pacific Trail Blue</div><div style="font-size:11px;color:#94a3b8;">Big Sur Coastal Expedition</div></div></div>
                  <div class="livery-card" data-paint-hex="0xe8e6df" data-paint-name="Sierra Expedition White"><div class="livery-swatch" style="background: #e8e6df;">🚙</div><div><div style="font-size:14px;font-weight:800;color:#fff;">Sierra Expedition White</div><div style="font-size:11px;color:#94a3b8;">High Alpine Overland Spec</div></div></div>
                  <div class="livery-card" data-paint-hex="0x22252a" data-paint-name="Matte Trail Black"><div class="livery-swatch" style="background: #22252a;">🚙</div><div><div style="font-size:14px;font-weight:800;color:#fff;">Matte Trail Black</div><div style="font-size:11px;color:#94a3b8;">Heavy-Duty Powder Coat</div></div></div>
                  <div class="livery-card" data-paint-hex="0xd95b28" data-paint-name="Baja Sunset Orange"><div class="livery-swatch" style="background: #d95b28;">🚙</div><div><div style="font-size:14px;font-weight:800;color:#fff;">Baja Sunset Orange</div><div style="font-size:11px;color:#94a3b8;">Baja 1000 Desert Racer</div></div></div>
                </div>
              </div>
            </div>

            <!-- 7. Diagnostics & Vehicle Reset App View -->
            <div class="tablet-view" id="tab-view-diagnostics">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">🔧 VEHICLE DIAGNOSTICS & ROADSIDE RESCUE</div>
                </div>
              </div>
              <div class="tablet-scroll-body">
                <div class="diag-action-strip">
                  <div class="diag-hero-btn dev-btn-primary" id="btn-tab-reset-road">
                    <span style="font-size: 26px;">🔄</span>
                    <span style="font-size: 14px;">PLACE ON ROAD</span>
                    <span style="font-size: 10px; opacity: 0.85;">Respawn upright on asphalt</span>
                  </div>
                  <div class="diag-hero-btn dev-btn-success" id="btn-tab-full-repair">
                    <span style="font-size: 26px;">✨</span>
                    <span style="font-size: 14px;">100% FULL REPAIR</span>
                    <span style="font-size: 10px; opacity: 0.85;">Restore chassis & refill nitro</span>
                  </div>
                  <div class="diag-hero-btn dev-btn-danger" id="btn-tab-call-tow">
                    <span style="font-size: 26px;">🚚</span>
                    <span style="font-size: 14px;">CALL TOW TRUCK</span>
                    <span style="font-size: 10px; opacity: 0.85;">Haul to station lift</span>
                  </div>
                </div>

                <div style="font-size: 13px; font-weight: 900; color: #ffd152; margin-top: 4px;">VEHICLE TELEMETRY & DAMAGE DIAGNOSTICS</div>
                <div class="diag-status-grid">
                  <div class="diag-metric-box"><span>Chassis Integrity:</span><span id="tab-diag-integrity" style="font-weight: 800; color: #38bdf8;">100% OK</span></div>
                  <div class="diag-metric-box"><span>Nose & Bumper:</span><span id="tab-diag-front" style="font-weight: 800; color: #22c55e;">OK</span></div>
                  <div class="diag-metric-box"><span>Engine & Tuning:</span><span id="tab-diag-engine" style="font-weight: 800; color: #22c55e;">100% POWER</span></div>
                  <div class="diag-metric-box"><span>Wheel Camber & Align:</span><span id="tab-diag-align" style="font-weight: 800; color: #22c55e;">OK</span></div>
                  <div class="diag-metric-box"><span>Rear Aero & Wing:</span><span id="tab-diag-aero" style="font-weight: 800; color: #22c55e;">OK</span></div>
                  <div class="diag-metric-box"><span>Surface Contact:</span><span id="tab-diag-surface" style="font-weight: 800; color: #38bdf8;">ASPHALT</span></div>
                </div>
              </div>
            </div>

            <!-- 8. Telemetry & Performance App View -->
            <div class="tablet-view" id="tab-view-perf">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">📊 SYSTEM TELEMETRY & FPS BENCHMARK</div>
                </div>
              </div>
              <div class="tablet-scroll-body">
                <div class="perf-kpi-grid">
                  <div class="perf-kpi-card">
                    <span class="perf-kpi-label">Current Rate</span>
                    <span class="perf-kpi-val green" id="perf-current-fps">60 FPS</span>
                    <span class="perf-kpi-sub" id="perf-frame-ms">16.6 ms/frame</span>
                  </div>
                  <div class="perf-kpi-card">
                    <span class="perf-kpi-label">5s Avg Rate</span>
                    <span class="perf-kpi-val" id="perf-avg-fps">60 FPS</span>
                    <span class="perf-kpi-sub" id="perf-fps-range">Min: 58 • Max: 60</span>
                  </div>
                  <div class="perf-kpi-card">
                    <span class="perf-kpi-label">1% Low (Stability)</span>
                    <span class="perf-kpi-val" id="perf-low1-fps">57 FPS</span>
                    <span class="perf-kpi-sub">Smooth pacing</span>
                  </div>
                  <div class="perf-kpi-card">
                    <span class="perf-kpi-label">Render Scale</span>
                    <span class="perf-kpi-val" id="perf-dpr-val">1.00x</span>
                    <span class="perf-kpi-sub" id="perf-resolution-val">Native HD</span>
                  </div>
                </div>

                <div class="perf-graph-container">
                  <div class="perf-graph-header">
                    <span>Frame Time History (Last 120 Frames)</span>
                    <span id="perf-target-text" style="color:#22c55e;">Target: 8.3ms (120 FPS)</span>
                  </div>
                  <canvas id="fps-graph-canvas" width="600" height="60"></canvas>
                </div>

                <div style="font-size: 12px; font-weight: 900; color: #38bdf8; margin-top: 10px; margin-bottom: 6px;">⚡ TARGET REFRESH RATE & FPS CAP</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
                  <button class="dev-tool-btn" data-target-fps="60" id="btn-fps-60">60 FPS</button>
                  <button class="dev-tool-btn active dev-btn-primary" data-target-fps="120" id="btn-fps-120">⚡ 120 FPS</button>
                  <button class="dev-tool-btn" data-target-fps="144" id="btn-fps-144">144 FPS</button>
                  <button class="dev-tool-btn" data-target-fps="uncapped" id="btn-fps-uncapped">🚀 MAX</button>
                </div>

                <div style="font-size: 12px; font-weight: 900; color: #ffd152; margin-bottom: 6px;">GRAPHICS PRESETS</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                  <button class="dev-tool-btn" data-preset="performance" id="btn-preset-perf">⚡ LOW (0.85x)</button>
                  <button class="dev-tool-btn active dev-btn-primary" data-preset="turbo120" id="btn-preset-turbo">🚀 TURBO 120</button>
                  <button class="dev-tool-btn" data-preset="balanced" id="btn-preset-bal">⚖️ BALANCED</button>
                  <button class="dev-tool-btn" data-preset="high" id="btn-preset-high">✨ ULTRA</button>
                </div>
              </div>
            </div>

            <!-- 9. Pacific Lore App View -->
            <div class="tablet-view" id="tab-view-lore">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">📖 PACIFIC COAST HERITAGE GUIDE</div>
                </div>
                <div style="font-size: 11px; font-weight: 800; color: #38bdf8;" id="tab-lore-count">0 / 45 DISCOVERED</div>
              </div>
              <div class="tablet-scroll-body">
                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 16px;">
                  <div style="font-size: 14px; font-weight: 800; color: #f8fafc; margin-bottom: 4px;">Historical Landmarks & Vista Turnouts</div>
                  <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                    As you cruise Highway 1 from Mojave Desert to Seattle, pull into scenic overlook turnouts [🅿️] to discover authentic historical plaques and earn bonus points.
                  </div>
                </div>
                <div id="tab-lore-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
              </div>
            </div>

            <!-- 10. Mystery Case Files App View -->
            <div class="tablet-view" id="tab-view-casefiles">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">🕵️ CASE FILE #94-B &bull; MOJAVE ARROWHEAD MOB HIT</div>
                </div>
                <div style="font-size: 11px; color: #ef4444; font-weight: 800;" id="tab-case-status-badge">UNWITNESSED</div>
              </div>
              <div class="tablet-scroll-body" id="tab-casefiles-body"></div>
            </div>

            <!-- 11. Save & Progress App View -->
            <div class="tablet-view" id="tab-view-savegame">
              <div class="tablet-nav-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title">💾 EXPEDITION SAVE & RESUME</div>
                </div>
                <div style="font-size: 11px; color: #10b981; font-weight: 800;" id="tab-save-status-badge">SAVED LOCALLY</div>
              </div>
              <div class="tablet-scroll-body" id="tab-savegame-body">
                <div class="diag-action-strip">
                  <div class="diag-hero-btn dev-btn-success" id="btn-tab-save-now">
                    <span style="font-size: 26px;">💾</span>
                    <span style="font-size: 14px;">SAVE PROGRESS NOW</span>
                    <span style="font-size: 10px; opacity: 0.85;">Save state to browser storage</span>
                  </div>
                  <div class="diag-hero-btn dev-btn-primary" id="btn-tab-export-json">
                    <span style="font-size: 26px;">📥</span>
                    <span style="font-size: 14px;">EXPORT SAVE FILE</span>
                    <span style="font-size: 10px; opacity: 0.85;">Download backup .json file</span>
                  </div>
                  <div class="diag-hero-btn dev-btn-primary" id="btn-tab-import-json">
                    <span style="font-size: 26px;">📤</span>
                    <span style="font-size: 14px;">IMPORT SAVE FILE</span>
                    <span style="font-size: 10px; opacity: 0.85;">Restore from backup .json</span>
                  </div>
                  <div class="diag-hero-btn dev-btn-danger" id="btn-tab-reset-run">
                    <span style="font-size: 26px;">🔄</span>
                    <span style="font-size: 14px;">RESET EXPEDITION</span>
                    <span style="font-size: 10px; opacity: 0.85;">Clear save & start new run</span>
                  </div>
                </div>
                <input type="file" id="input-tab-import-file" accept=".json" style="display: none;" />

                <div style="font-size: 13px; font-weight: 900; color: #ffd152; margin-top: 4px;">CURRENT PROGRESS SNAPSHOT</div>
                <div class="diag-status-grid">
                  <div class="diag-metric-box"><span>Current Zone:</span><span id="tab-save-zone" style="font-weight: 800; color: #38bdf8;">ZONE 0 • SOCAL DESERT</span></div>
                  <div class="diag-metric-box"><span>Highway Coordinate:</span><span id="tab-save-coord" style="font-weight: 800; color: #34d399;">Z = 0m</span></div>
                  <div class="diag-metric-box"><span>Total Score:</span><span id="tab-save-score" style="font-weight: 800; color: #facc15;">0 PTS</span></div>
                  <div class="diag-metric-box"><span>Route 66 Shields:</span><span id="tab-save-shields" style="font-weight: 800; color: #38bdf8;">0 / 5</span></div>
                  <div class="diag-metric-box"><span>Mob Hit Clues:</span><span id="tab-save-clues" style="font-weight: 800; color: #ef4444;">0 / 9 FOUND</span></div>
                  <div class="diag-metric-box"><span>Vehicle Integrity:</span><span id="tab-save-integrity" style="font-weight: 800; color: #22c55e;">100% OK</span></div>
                  <div class="diag-metric-box"><span>Historical Archives:</span><span id="tab-save-lore" style="font-weight: 800; color: #fbbf24;">0 DISCOVERED</span></div>
                  <div class="diag-metric-box"><span>Last Saved Time:</span><span id="tab-save-time" style="font-weight: 800; color: #94a3b8;">NOT SAVED YET</span></div>
                </div>

                <div style="margin-top: 14px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                  <strong style="color: #38bdf8;">💡 Seamless Persistence:</strong>
                  Your vehicle position, score, repairs, Route 66 shields, and GTA crime clues auto-save continuously in your browser. Leaving this page or closing the tab preserves your journey on Highway 1 automatically.
                </div>
              </div>
            </div>

            <!-- 12. YouTube Music & Video App View -->
            <div class="tablet-view" id="tab-view-youtube">
              <div class="tablet-nav-header yt-app-header">
                <div class="tablet-nav-left">
                  <button class="tablet-back-btn" data-back-home="true">⬅ APPS</button>
                  <div class="tablet-view-title" style="display: flex; align-items: center; gap: 6px;">
                    <span class="yt-header-badge">▶ YOUTUBE</span>
                    <span class="yt-header-sub">Highway Infotainment</span>
                  </div>
                </div>
                <div class="yt-nav-right">
                  <span class="yt-live-pill" id="yt-tab-live-status">LIVE STREAM READY</span>
                  <button class="yt-drive-btn" id="yt-btn-drive-listen" title="Close tablet and continue driving with music playing">
                    🚗 RESUME DRIVE
                  </button>
                </div>
              </div>

              <div class="tablet-scroll-body yt-scroll-container">
                <!-- Search & URL Bar -->
                <div class="yt-search-wrapper">
                  <div class="yt-search-input-box">
                    <span class="yt-search-icon">🔍</span>
                    <input type="text" id="yt-search-input" placeholder="Search any song, artist, album, or paste YouTube link..." autocomplete="off" spellcheck="false" />
                    <button id="yt-search-clear-btn" class="yt-search-clear" style="display: none;">✕</button>
                  </div>
                  <button id="yt-search-submit-btn" class="yt-btn-search">SEARCH YOUTUBE</button>
                </div>

                <!-- Genre Filter Chips -->
                <div class="yt-genre-tabs" id="yt-genre-tabs">
                  <button class="yt-genre-tab active" data-yt-genre="all">🔥 All Anthems</button>
                  <button class="yt-genre-tab" data-yt-genre="synthwave">🌴 Synthwave &amp; Outrun</button>
                  <button class="yt-genre-tab" data-yt-genre="rock">🎸 Highway Classics</button>
                  <button class="yt-genre-tab" data-yt-genre="eurobeat">🏎️ Phonk &amp; Eurobeat</button>
                  <button class="yt-genre-tab" data-yt-genre="chillhop">☕ Lo-Fi Cruise</button>
                  <button class="yt-genre-tab" data-yt-genre="cyberpunk">⚡ Cyberpunk / Electro</button>
                  <button class="yt-genre-tab" data-yt-genre="westcoast">📻 West Coast Hits</button>
                </div>

                <!-- Now Playing Hero Deck with Player Dock Target -->
                <div class="yt-now-playing-deck">
                  <div class="yt-deck-screen-area" id="yt-deck-screen-anchor">
                    <div id="yt-dock-target" class="yt-dock-target"></div>
                  </div>
                  <div class="yt-deck-info">
                    <div class="yt-deck-status-row">
                      <span class="yt-audio-spectrum" id="yt-spectrum-indicator">
                        <span></span><span></span><span></span><span></span><span></span>
                      </span>
                      <span class="yt-playing-badge" id="yt-deck-playing-state">READY TO PLAY</span>
                      <a id="yt-deck-external-link" class="yt-deck-ext-btn" href="https://www.youtube.com/watch?v=7j_U15xJnuY" target="_blank" rel="noopener noreferrer" title="Open song directly on YouTube in a new tab">↗ YOUTUBE</a>
                    </div>
                    <div class="yt-deck-title" id="yt-deck-title">Time Squared</div>
                    <div class="yt-deck-artist" id="yt-deck-artist">Switch Mongo</div>
                    <div class="yt-deck-controls">
                      <button class="yt-ctrl-btn" id="yt-btn-prev" title="Previous Track">⏮</button>
                      <button class="yt-ctrl-btn yt-btn-play-large" id="yt-btn-play-toggle" title="Play / Pause">▶</button>
                      <button class="yt-ctrl-btn" id="yt-btn-next" title="Next Track">⏭</button>
                      <div class="yt-volume-box">
                        <button class="yt-ctrl-btn-mini" id="yt-btn-mute-toggle" title="Mute / Unmute">🔊</button>
                        <input type="range" id="yt-volume-slider" min="0" max="100" value="100" class="yt-range" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Custom Search Action Card (shown when user searches) -->
                <div id="yt-custom-search-card" class="yt-custom-search-card" style="display: none;">
                  <div class="yt-custom-search-icon">▶️</div>
                  <div class="yt-custom-search-text">
                    <div class="yt-custom-search-title" id="yt-custom-query-title">Search YouTube for "..."</div>
                    <div class="yt-custom-search-sub">Click to launch live YouTube player stream</div>
                  </div>
                  <button class="yt-custom-search-play-btn" id="yt-custom-search-play-btn">▶ PLAY MATCH</button>
                </div>

                <!-- Track Catalog Header & Grid -->
                <div class="yt-catalog-header">
                  <span id="yt-catalog-count-label">Featured Highway Anthems</span>
                  <span style="font-size: 11px; color: #94a3b8;">Click any track to stream instantly</span>
                </div>
                <div class="yt-track-grid" id="yt-track-grid">
                  <!-- Dynamically populated -->
                </div>
              </div>

              <!-- Fixed Mobile Action Bar (Always visible on mobile) -->
              <div class="yt-mobile-drive-bar">
                <button class="yt-drive-btn-mobile" id="yt-btn-drive-listen-mobile" title="Close tablet and continue driving with music playing">
                  🚗 RESUME DRIVING &amp; LISTEN
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Home Indicator -->
          <div class="tablet-home-indicator" id="tablet-home-bar" title="Return to Apps Home"></div>
        </div>
      </div>

      <!-- 📖 Heritage Historical Plaque Modal -->
      <div id="hud-history-modal">
        <div class="history-modal-card">
          <div class="history-modal-header">
            <div>
              <div class="history-zone-badge" id="history-zone-tag" style="color: #fbbf24; font-size: 10px; font-weight: 900;">ZONE 0: MOJAVE</div>
              <div class="history-modal-title" id="history-modal-title" style="font-size: 20px; font-weight: 900; color: #fff;">Historic Landmark</div>
              <div class="history-modal-sub" id="history-modal-sub" style="font-size: 12px; color: #fde047;">Scenic Highway 1 Heritage Plaque</div>
            </div>
            <button class="history-close-btn" id="history-modal-close-btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">✕</button>
          </div>
          <div class="history-modal-body">
            <div class="history-modal-photo-wrapper" id="history-modal-photo-box" style="display: none;">
              <canvas id="history-modal-photo-canvas" width="640" height="320"></canvas>
              <div class="history-photo-badge" id="history-photo-badge">📷 HERITAGE SURVEY PHOTO</div>
            </div>
            <div id="history-meta-bar" style="display: flex; gap: 14px; flex-wrap: wrap; font-size: 11px; color: #94a3b8; font-family: monospace; padding: 2px 4px;">
              <span id="history-year-est" style="color: #fbbf24; font-weight: 700;"></span>
              <span id="history-coords" style="color: #38bdf8;"></span>
              <span id="history-elevation" style="color: #34d399;"></span>
            </div>
            <div id="history-desc-photos" class="history-desc-photos"></div>
            <div id="history-lore-text" style="white-space: pre-line; color: #cbd5e1; font-size: 14px; line-height: 1.65;"></div>
            <div id="history-fast-fact" style="background: rgba(30, 41, 59, 0.6); border-left: 3px solid #fbbf24; border-radius: 0 8px 8px 0; padding: 10px 14px; font-size: 12px; color: #e2e8f0; line-height: 1.5; margin-top: 4px;">
              <strong style="color: #fde047; display: block; margin-bottom: 2px;">⚡ FAST FACT</strong>
              <span id="history-fast-fact-body"></span>
            </div>
          </div>
          <div class="history-modal-footer">
            <span id="history-discovery-count" style="font-size: 11px; color: #94a3b8; font-weight: 800;">ARCHIVE</span>
            <button id="btn-history-close" class="dev-tool-btn dev-btn-primary">CLOSE [ESC]</button>
          </div>
        </div>
      </div>

      <!-- 👁️ COIN-OPERATED SCENIC BINOCULARS FULLSCREEN OPTICAL OVERLAY -->
      <div id="hud-binocular-overlay">
        <!-- Dual Aperture Optical Crosshair Layer -->
        <div class="binocular-crosshair-layer">
          <div class="binocular-reticle">
            <div class="binocular-reticle-circle"></div>
            <div class="binocular-cross-h"></div>
            <div class="binocular-cross-v"></div>
            <div class="binocular-mil-dots">100 • 300 • 800 • 1500M</div>
          </div>
        </div>

        <!-- Top Bar: Title & Live Azimuth Compass -->
        <div class="binocular-top-bar">
          <div class="binocular-title-group">
            <span class="binocular-brand">★ TOWER OPTICAL CO. • COIN-OPERATED SCENIC VIEWFINDER ★</span>
            <span class="binocular-view-name" id="binocular-view-name">COYOTE RIDGE SUMMIT OVERLOOK • ELEV 2,840 FT</span>
          </div>
          <div class="binocular-compass-badge" id="binocular-compass-badge">
            <span>🧭</span>
            <span id="binocular-heading-val">094° E</span>
          </div>
        </div>

        <!-- Bottom Bar: Landmark Target, Zoom Level & Exit Controls -->
        <div class="binocular-bottom-bar">
          <div class="binocular-target-box">
            <span class="binocular-target-label">TARGET IN SIGHT</span>
            <span class="binocular-target-val" id="binocular-target-val">MOJAVE DESERT VALLEY & ROUTE 66 OVERLOOK</span>
          </div>
          <div class="binocular-controls-group">
            <button class="binocular-btn" id="btn-binocular-zoom-out" title="Zoom Out (-)">🔍 -</button>
            <span class="binocular-zoom-indicator" id="binocular-zoom-indicator">12.5x</span>
            <button class="binocular-btn" id="btn-binocular-zoom-in" title="Zoom In (+)">🔍 +</button>
            <button class="binocular-btn binocular-btn-exit" id="btn-binocular-exit">✕ EXIT (ESC / E)</button>
          </div>
        </div>
      </div>

      <!-- 🎬 CINEMATIC LETTERBOX CUTSCENE OVERLAY -->
      <div id="hud-cutscene-overlay">
        <div class="cutscene-bar cutscene-bar-top">
          <div class="cutscene-rec-indicator">
            <span class="cutscene-rec-dot"></span>
            <span class="cutscene-rec-text">REC &bull; 24 FPS</span>
          </div>
          <div class="cutscene-title" id="cutscene-title-text">★ HIGHWAY 1 CRIME DOSSIER ★</div>
          <button class="cutscene-skip-btn" id="cutscene-skip-btn">SKIP [ESC]</button>
        </div>
        <div class="cutscene-letterbox-content">
          <div class="cutscene-subtitles-box" id="cutscene-subtitles-box">
            <div class="cutscene-subtitles-text" id="cutscene-subtitles-text">Surveilling clandestine Arrowhead Canyon transaction...</div>
          </div>
        </div>
        <div class="cutscene-bar cutscene-bar-bottom"></div>
      </div>

      <!-- Start Awaken Gate (non-blocking, hidden) -->
      <div id="start-awaken-screen" class="gate-hidden" style="display: none;">
        <div id="start-awaken-btn" style="display: none;"></div>
      </div>

      <!-- 💾 Auto-Load Expedition Resume Prompt Modal -->
      <div id="hud-resume-backdrop" class="hud-modal-backdrop">
        <div id="hud-resume-card" class="hud-center-modal-card">
          <div class="resume-card-header">
            <div class="resume-card-badge">💾 EXPEDITION RESTORED</div>
            <div class="resume-card-title">PACIFIC COAST HIGHWAY 1</div>
            <div class="resume-card-zone" id="resume-card-zone-text">ZONE 0 • SOUTHERN CALIFORNIA DESERT</div>
            <div class="resume-card-coord" id="resume-card-coord-text">Highway Position: Z = 0m</div>
          </div>
          <div class="resume-card-stats-grid">
            <div class="resume-stat-pill">
              <span class="stat-lbl">SCORE</span>
              <span class="stat-num" id="resume-card-score">0 PTS</span>
            </div>
            <div class="resume-stat-pill">
              <span class="stat-lbl">ROUTE 66</span>
              <span class="stat-num" id="resume-card-shields">0 / 5</span>
            </div>
            <div class="resume-stat-pill">
              <span class="stat-lbl">MOB EVIDENCE</span>
              <span class="stat-num" id="resume-card-clues">0 / 9</span>
            </div>
            <div class="resume-stat-pill">
              <span class="stat-lbl">INTEGRITY</span>
              <span class="stat-num" id="resume-card-integrity">100%</span>
            </div>
          </div>
          <div class="resume-card-actions">
            <button id="btn-resume-continue" class="resume-hero-btn resume-btn-drive">
              <span class="btn-main-text">▶ CONTINUE EXPEDITION</span>
              <span class="btn-sub-text">Resume your journey right where you left off</span>
            </button>
            <button id="btn-resume-fresh" class="resume-hero-btn resume-btn-fresh">
              <span class="btn-main-text">🔄 START FRESH</span>
              <span class="btn-sub-text">Clear save data & begin new journey from start</span>
            </button>
          </div>
          <div class="resume-card-hint">
            <span>💡 Progress auto-saves continuously to your browser. Press [W], [SPACE], or click Continue to drive.</span>
          </div>
        </div>
      </div>

      <!-- ⏸️ Global Pause / Expedition Menu Modal [ESC] -->
      <div id="hud-pause-backdrop" class="hud-modal-backdrop">
        <div id="hud-pause-card" class="hud-center-modal-card">
          <div class="pause-card-header">
            <div class="pause-card-badge">⏸️ EXPEDITION PAUSED</div>
            <div class="pause-card-title">PACIFIC HIGHWAY 1</div>
            <div class="pause-card-zone" id="pause-card-zone-text">ZONE 0 • HIGHWAY 1</div>
          </div>
          <div class="pause-card-actions">
            <button id="btn-pause-resume" class="pause-menu-btn pause-btn-primary">
              <span class="btn-icon">▶</span>
              <div class="btn-label-block">
                <span class="btn-title">RESUME EXPEDITION</span>
                <span class="btn-desc">Continue driving on the open road [ESC]</span>
              </div>
            </button>
            <button id="btn-pause-tablet" class="pause-menu-btn pause-btn-accent">
              <span class="btn-icon">📱</span>
              <div class="btn-label-block">
                <span class="btn-title">IN-CAR TABLET DASHBOARD</span>
                <span class="btn-desc">Open navigation, radio, camera & GPS apps [TAB]</span>
              </div>
            </button>
            <button id="btn-pause-rescue" class="pause-menu-btn pause-btn-secondary">
              <span class="btn-icon">🔄</span>
              <div class="btn-label-block">
                <span class="btn-title">RECOVER TO HIGHWAY</span>
                <span class="btn-desc">Cleanly reposition vehicle onto road center [R]</span>
              </div>
            </button>
            <button id="btn-pause-reset-fresh" class="pause-menu-btn pause-btn-danger">
              <span class="btn-icon">⚠️</span>
              <div class="btn-label-block">
                <span class="btn-title">START FRESH / RESET EXPEDITION</span>
                <span class="btn-desc">Permanently erase saved spot & restart from beginning</span>
              </div>
            </button>
          </div>
          <div class="pause-card-footer">
            <span id="pause-auto-save-status">💾 Auto-Save Active &bull; Progress backed up in browser storage</span>
          </div>
        </div>
      </div>

      <!-- General Feedback Toast -->
      <div id="hud-action-toast" class="hud-panel">
        <span id="action-toast-badge" style="background: #f4c522; color: #0f172a; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">⚡ BONUS</span>
        <div id="action-toast-title" style="font-size: 15px; font-weight: 800; margin-top: 2px;">ACTION COMPLETED</div>
      </div>

      <!-- Rescue Toast -->
      <div id="hud-rescue-toast" class="hud-panel" style="top: 100px; left: 50%; transform: translateX(-50%); border-color: #ef4444;">
        <span style="font-size: 12px; font-weight: 900; color: #ef4444;">⚠️ RESCUED</span>
        <div style="font-size: 14px; font-weight: 800;">PLACED BACK ON HIGHWAY 1</div>
      </div>

      <!-- Inverted / Rollover Alert -->
      <div id="hud-flip-alert" class="hud-panel" style="top: 35%; left: 50%; transform: translateX(-50%); border-color: #ef4444;">
        <span style="font-size: 12px; font-weight: 900; color: #ef4444;">⚠️ VEHICLE ROLLED OVER</span>
        <div style="font-size: 16px; font-weight: 800; margin: 4px 0;">RESETTING POSITION...</div>
        <button id="btn-manual-rescue" class="dev-tool-btn dev-btn-primary" style="margin-top: 6px;">RECOVER NOW</button>
      </div>

      <!-- Out-of-Bounds Recovery Alert (Only shown if way out of bounds) -->
      <div id="hud-stuck-alert" class="hud-panel">
        <span style="font-size: 12px; font-weight: 900; color: #f59e0b;">⚠️ VEHICLE OUT OF BOUNDS</span>
        <div style="font-size: 13px; font-weight: 700; color: #cbd5e1; margin-bottom: 4px;">TAP TO RECOVER CLEANLY TO HIGHWAY</div>
        <button id="btn-stuck-rescue" class="dev-tool-btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 900; border: none; border-radius: 8px; padding: 8px 18px; cursor: pointer; letter-spacing: 0.5px; font-size: 12px;">🔄 RESCUE TO ROAD (OR PRESS [R])</button>
      </div>

      <!-- Drift Badge -->
      <div id="hud-drift-badge">
        <div style="font-size: 10px; font-weight: 900; letter-spacing: 1px;">🔥 DRIFT COMBO</div>
        <div id="drift-val" style="font-size: 20px; font-weight: 900;">+0 x1.0</div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Initialize References
    this.speedEl = this.container.querySelector('#speed-val');
    this.nitroPct = this.container.querySelector('#nitro-pct');
    this.nitroBar = this.container.querySelector('#nitro-bar');
    this.integrityBar = this.container.querySelector('#integrity-bar');
    this.integrityVal = this.container.querySelector('#integrity-val');

    // 🏔️ Off-Road Telemetry & Inclinometer Cluster Elements
    this.offroadCluster = this.container.querySelector('#hud-offroad-cluster');
    this.offroadBackdrop = this.container.querySelector('#hud-offroad-backdrop');
    this.telemetryBtn = this.container.querySelector('#hud-telemetry-btn');
    this.telemetryBtnLabel = this.container.querySelector('#telemetry-btn-label');
    this.telemetryCloseBtn = this.container.querySelector('#telemetry-close-btn');
    this.isTelemetryOpen = false;

    this.inclinometerRollDisc = this.container.querySelector('#inclinometer-roll-disc');
    this.inclinometerRollVal = this.container.querySelector('#inclinometer-roll-val');
    this.inclinometerPitchBubble = this.container.querySelector('#pitch-bubble');
    this.inclinometerPitchVal = this.container.querySelector('#inclinometer-pitch-val');
    this.altimeterVal = this.container.querySelector('#altimeter-val');
    this.gradeVal = this.container.querySelector('#grade-val');
    this.btnToggle4x4 = this.container.querySelector('#btn-toggle-4x4');
    this.hud4x4Badge = this.container.querySelector('#hud-4x4-badge');
    this.drivetrainModeVal = this.container.querySelector('#drivetrain-mode-val');
    this.drivetrainLockIndicator = this.container.querySelector('#drivetrain-lock-indicator');
    this.trailStageBadge = this.container.querySelector('#trail-stage-badge');
    this.rolloverHazardBanner = this.container.querySelector('#rollover-hazard-banner');
    this.spotterRadioText = this.container.querySelector('#spotter-radio-text');

    // Hook up click listeners for 4x4 mode cycling inside modal
    const handle4x4Click = (e) => {
      if (e) e.stopPropagation();
      if (this._physicsRef && this._physicsRef.cycleDriveMode) {
        this._physicsRef.cycleDriveMode();
      } else if (window.game && window.game.physics && window.game.physics.cycleDriveMode) {
        window.game.physics.cycleDriveMode();
      }
    };
    if (this.btnToggle4x4) this.btnToggle4x4.addEventListener('click', handle4x4Click);

    // Wrong Gear Alert Banner Element & Click Shifter
    this.gearAlertEl = this.container.querySelector('#hud-gear-alert');
    this.gearAlertTitle = this.container.querySelector('#gear-alert-title-text');
    this.gearAlertSub = this.container.querySelector('#gear-alert-subtitle-text');
    this.gearAlertKey = this.container.querySelector('#gear-alert-key');

    if (this.gearAlertEl) {
      this.gearAlertEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const phys = this._physicsRef || (window.game && window.game.physics);
        if (phys) {
          if (gameState.isWrongGear && gameState.recommendedDriveMode && phys.setDriveMode) {
            phys.setDriveMode(gameState.recommendedDriveMode);
          } else if (phys.cycleDriveMode) {
            phys.cycleDriveMode();
          }
        }
      });
    }

    // Clicking top bar telemetry button toggles modal open/closed
    if (this.telemetryBtn) {
      this.telemetryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTelemetry();
      });
    }

    // Clicking speedometer 4x4 badge also toggles modal
    if (this.hud4x4Badge) {
      this.hud4x4Badge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTelemetry();
      });
    }

    // Close button & backdrop click
    if (this.telemetryCloseBtn) {
      this.telemetryCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTelemetry();
      });
    }
    if (this.offroadBackdrop) {
      this.offroadBackdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTelemetry();
      });
    }

    // Live Real-Time FPS Badge
    this.hudLiveFpsBadge = this.container.querySelector('#hud-live-fps');
    this.hudLiveFpsVal = this.container.querySelector('#hud-live-fps-val');
    this.hudLiveMsVal = this.container.querySelector('#hud-live-ms-val');

    // Tablet References
    this.tabletBtn = this.container.querySelector('#hud-tablet-btn');
    this.tabletModal = this.container.querySelector('#hud-tablet-modal');
    this.tabletCloseBtn = this.container.querySelector('#tablet-close-btn');
    this.tabletHomeBar = this.container.querySelector('#tablet-home-bar');
    this.tabletClock = this.container.querySelector('#tablet-clock');
    this.tabletStatusZone = this.container.querySelector('#tablet-status-zone');
    this.tabletViews = this.container.querySelectorAll('.tablet-view');

    // Tablet GPS Map & Milestones Elements
    this.tabRadarCanvas = this.container.querySelector('#tab-radar-canvas');
    this.tabRadarCtx = this.tabRadarCanvas ? this.tabRadarCanvas.getContext('2d') : null;
    this.tabGpsHeading = this.container.querySelector('#tab-gps-heading');
    this.tabGpsSurface = this.container.querySelector('#tab-gps-surface');
    this.tabGpsCoords = this.container.querySelector('#tab-gps-coords');
    this.tabMilestoneZoneNum = this.container.querySelector('#tab-milestone-zone-num');
    this.tabMilestoneZoneName = this.container.querySelector('#tab-milestone-zone-name');
    this.tabMilestoneZoneSub = this.container.querySelector('#tab-milestone-zone-sub');
    this.tabMilestoneTemp = this.container.querySelector('#tab-milestone-temp');
    this.tabMilestoneDist = this.container.querySelector('#tab-milestone-dist');
    this.tabMilestonePct = this.container.querySelector('#tab-milestone-pct');
    this.tabProgressFill = this.container.querySelector('#tab-progress-fill');
    this.tabMilestoneStatus = this.container.querySelector('#tab-milestone-status');
    this.tabCheckpointItems = this.container.querySelectorAll('.milestone-checkpoint-item');

    // Diagnostics App Elements
    this.tabDiagIntegrity = this.container.querySelector('#tab-diag-integrity');
    this.tabDiagFront = this.container.querySelector('#tab-diag-front');
    this.tabDiagEngine = this.container.querySelector('#tab-diag-engine');
    this.tabDiagAlign = this.container.querySelector('#tab-diag-align');
    this.tabDiagAero = this.container.querySelector('#tab-diag-aero');
    this.tabDiagSurface = this.container.querySelector('#tab-diag-surface');

    // Performance App Elements
    this.perfCurrentFps = this.container.querySelector('#perf-current-fps');
    this.perfFrameMs = this.container.querySelector('#perf-frame-ms');
    this.perfAvgFps = this.container.querySelector('#perf-avg-fps');
    this.perfFpsRange = this.container.querySelector('#perf-fps-range');
    this.perfLow1Fps = this.container.querySelector('#perf-low1-fps');
    this.perfDprVal = this.container.querySelector('#perf-dpr-val');
    this.perfResolutionVal = this.container.querySelector('#perf-resolution-val');
    this.fpsGraphCanvas = this.container.querySelector('#fps-graph-canvas');
    this.fpsGraphCtx = this.fpsGraphCanvas ? this.fpsGraphCanvas.getContext('2d') : null;
    this.presetBtnPerf = this.container.querySelector('#btn-preset-perf');
    this.presetBtnTurbo = this.container.querySelector('#btn-preset-turbo');
    this.presetBtnBal = this.container.querySelector('#btn-preset-bal');
    this.presetBtnHigh = this.container.querySelector('#btn-preset-high');
    this.perfTargetText = this.container.querySelector('#perf-target-text');
    this.btnFps60 = this.container.querySelector('#btn-fps-60');
    this.btnFps120 = this.container.querySelector('#btn-fps-120');
    this.btnFps144 = this.container.querySelector('#btn-fps-144');
    this.btnFpsUncapped = this.container.querySelector('#btn-fps-uncapped');

    // Toasts & Prompts
    this.actionToast = this.container.querySelector('#hud-action-toast');
    this.actionToastBadge = this.container.querySelector('#action-toast-badge');
    this.actionToastTitle = this.container.querySelector('#action-toast-title');
    this.rescueToast = this.container.querySelector('#hud-rescue-toast');
    this.flipAlert = this.container.querySelector('#hud-flip-alert');
    this.stuckAlert = this.container.querySelector('#hud-stuck-alert');
    this._cacheOutOfBounds = false;
    this.driftBadge = this.container.querySelector('#hud-drift-badge');
    this.driftVal = this.container.querySelector('#drift-val');
    this.scenicWaypoint = this.container.querySelector('#hud-scenic-waypoint');
    this.scenicLotName = this.container.querySelector('#scenic-lot-name');
    this.scenicLotSub = this.container.querySelector('#scenic-lot-sub');
    this.scenicLotDist = this.container.querySelector('#scenic-lot-dist');
    this.scenicLotUnit = this.container.querySelector('#scenic-lot-unit');
    this.scenicWaypointTitle = this.container.querySelector('#scenic-waypoint-title');
    this.scenicWaypointIcon = this.container.querySelector('#scenic-waypoint-icon');
    this.scenicExitSide = this.container.querySelector('#scenic-exit-side');
    this.scenicActionHint = this.container.querySelector('#scenic-action-hint');
    this.scenicProgressBar = this.container.querySelector('#scenic-progress-bar');
    this.scenicCloseBtn = this.container.querySelector('#scenic-waypoint-close');
    this._lastAlertedLotId = null;
    this._lastAnimatedLotId = null;
    this._scenicAlertStartTime = 0;
    this._scenicDismissedByUser = false;
    this._lastNearZoneTriggered = false;
    this._currentApproachingLot = null;
    this._isInCurrentLot = false;
    this._physicsRef = null;
    this.historyPromptPill = this.container.querySelector('#hud-history-prompt-pill');
    this.historyPromptHeader = this.container.querySelector('#history-prompt-header');
    this.historyPromptName = this.container.querySelector('#history-prompt-name');
    this.historyModal = this.container.querySelector('#hud-history-modal');
    this.historyCloseBtn = this.container.querySelector('#history-modal-close-btn');
    this.historyCloseFooterBtn = this.container.querySelector('#btn-history-close');
    this.historyLoreText = this.container.querySelector('#history-lore-text');
    this.historyZoneTag = this.container.querySelector('#history-zone-tag');
    this.historyModalTitle = this.container.querySelector('#history-modal-title');
    this.historyModalSub = this.container.querySelector('#history-modal-sub');
    this.historyDiscoveryCount = this.container.querySelector('#history-discovery-count');
    this.historyPhotoCanvas = this.container.querySelector('#history-modal-photo-canvas');
    this.historyPhotoBadge = this.container.querySelector('#history-photo-badge');
    this.historyDescPhotos = this.container.querySelector('#history-desc-photos');
    this.historyYearEst = this.container.querySelector('#history-year-est');
    this.historyCoords = this.container.querySelector('#history-coords');
    this.historyElevation = this.container.querySelector('#history-elevation');
    this.historyFastFactBody = this.container.querySelector('#history-fast-fact-body');

    // Binocular Viewfinder Elements
    this.binocularPromptPill = this.container.querySelector('#hud-binocular-prompt-pill');
    this.binocularPromptName = this.container.querySelector('#binocular-prompt-name');
    this.binocularOverlay = this.container.querySelector('#hud-binocular-overlay');
    this.binocularViewName = this.container.querySelector('#binocular-view-name');
    this.binocularHeadingVal = this.container.querySelector('#binocular-heading-val');
    this.binocularTargetVal = this.container.querySelector('#binocular-target-val');
    this.binocularZoomIndicator = this.container.querySelector('#binocular-zoom-indicator');
    this.btnBinocularZoomIn = this.container.querySelector('#btn-binocular-zoom-in');
    this.btnBinocularZoomOut = this.container.querySelector('#btn-binocular-zoom-out');
    this.btnBinocularExit = this.container.querySelector('#btn-binocular-exit');

    // Cutscene Overlay Elements
    this.cutsceneOverlay = this.container.querySelector('#hud-cutscene-overlay');
    this.cutsceneTitleText = this.container.querySelector('#cutscene-title-text');
    this.cutsceneSubtitlesText = this.container.querySelector('#cutscene-subtitles-text');
    this.cutsceneSkipBtn = this.container.querySelector('#cutscene-skip-btn');

    this.startScreen = this.container.querySelector('#start-awaken-screen');
    this.startBtn = this.container.querySelector('#start-awaken-btn');
    this.fellowTagsContainer = this.container.querySelector('#fellow-player-tags-container');
    this.tagElementsMap = new Map();

    // Expedition Resume Prompt & Pause Modal Elements
    this.resumeBackdrop = this.container.querySelector('#hud-resume-backdrop');
    this.pauseBackdrop = this.container.querySelector('#hud-pause-backdrop');
    this.pauseBtn = this.container.querySelector('#hud-pause-btn');
    this.isResumePromptActive = false;
    this.isPauseMenuOpen = false;

    this.bindEvents();
  }

  bindEvents() {
    // Cutscene Skip Click
    if (this.cutsceneSkipBtn) {
      this.cutsceneSkipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window !== 'undefined' && window.game) {
          if (window.game.activeZoneCutscene && window.game.activeZoneCutscene.isCinematicPlaying) {
            window.game.activeZoneCutscene.skipCutscene();
          } else if (window.game.mysteryCrimeScene) {
            window.game.mysteryCrimeScene.skipCutscene();
          }
        }
      });
    }

    // Binocular Prompt Pill Click/Touch
    if (this.binocularPromptPill) {
      this.binocularPromptPill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openBinocularView();
      });
    }

    const targetBox = this.container.querySelector('.binocular-target-box');
    if (targetBox) {
      targetBox.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.cameraManager && window.game.cameraManager.triggerActiveSurveillance) {
          window.game.cameraManager.triggerActiveSurveillance();
        }
      });
    }

    if (this.btnBinocularExit) {
      this.btnBinocularExit.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeBinocularView();
      });
    }

    if (this.btnBinocularZoomIn) {
      this.btnBinocularZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.cameraManager) {
          window.game.cameraManager.adjustBinocularZoom(-4.0);
        }
      });
    }

    if (this.btnBinocularZoomOut) {
      this.btnBinocularZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.cameraManager) {
          window.game.cameraManager.adjustBinocularZoom(4.0);
        }
      });
    }
    // 1. Tablet Open / Close
    if (this.tabletBtn) {
      this.tabletBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTablet();
      });
    }

    if (this.hudLiveFpsBadge) {
      this.hudLiveFpsBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTablet('perf');
      });
    }

    if (this.tabletCloseBtn) {
      this.tabletCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTablet();
      });
    }

    if (this.tabletHomeBar) {
      this.tabletHomeBar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTabletApp('home');
      });
    }

    if (this.tabletModal) {
      this.tabletModal.addEventListener('click', (e) => {
        if (e.target === this.tabletModal) {
          this.closeTablet();
        }
      });
    }

    // 2. Home App Grid Cards
    this.container.querySelectorAll('.tablet-app-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const appId = card.getAttribute('data-open-app');
        if (appId) this.openTabletApp(appId);
      });
    });

    // 3. Back to Home Buttons inside Apps
    this.container.querySelectorAll('[data-back-home="true"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTabletApp('home');
      });
    });
    // 5. Camera App View
    this.container.querySelectorAll('[data-cam-mode]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = card.getAttribute('data-cam-mode');
        gameState.cameraMode = mode;
        if (window.game && window.game.cameraManager) {
          window.game.cameraManager.setMode(mode);
        }
        this.updateCameraCards(mode);
        this.showActionToast('🎥 CAMERA CHANGED', `${mode.toUpperCase()} VIEW ACTIVE`, 2000);
      });
    });

    const photoBtn = this.container.querySelector('#btn-tab-photo-mode');
    if (photoBtn) {
      photoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTablet();
        if (window.game && window.game.input && window.game.input.onPhotoModeToggle) {
          window.game.input.onPhotoModeToggle();
        }
      });
    }

    // 6. Weather App View
    this.container.querySelectorAll('[data-weather-mode]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = card.getAttribute('data-weather-mode');
        gameState.debugRainMode = mode;
        this.updateWeatherCards(mode);
        this.showActionToast('🌧️ WEATHER MODE', `WEATHER: ${mode.toUpperCase()}`, 2000);
      });
    });

    // 7. Livery App View
    this.container.querySelectorAll('[data-paint-hex]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const hex = parseInt(card.getAttribute('data-paint-hex'), 16);
        const name = card.getAttribute('data-paint-name');
        if (window.game && window.game.sportsCar && window.game.sportsCar.setPaintColor) {
          window.game.sportsCar.setPaintColor(hex, name);
        }
        this.updateLiveryCards(hex);
        this.showActionToast('🎨 VEHICLE LIVERY', `${name.toUpperCase()} APPLIED`, 2000);
      });
    });

    const cycleLiveryBtn = this.container.querySelector('#btn-tab-cycle-livery');
    if (cycleLiveryBtn) {
      cycleLiveryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.sportsCar && window.game.sportsCar.cyclePaintColor) {
          const colorName = window.game.sportsCar.cyclePaintColor();
          this.showActionToast('🎨 VEHICLE LIVERY', `${colorName.toUpperCase()} APPLIED`, 2000);
        }
      });
    }

    // 8. Diagnostics App View Actions
    const tabResetRoad = this.container.querySelector('#btn-tab-reset-road');
    if (tabResetRoad) {
      tabResetRoad.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.physics) {
          window.game.physics.respawnOnRoad();
        }
        this.closeTablet();
        this.showActionToast('🔄 VEHICLE RESET', 'CAR PLACED CLEANLY ON HIGHWAY 1', 2500);
      });
    }

    const tabFullRepair = this.container.querySelector('#btn-tab-full-repair');
    if (tabFullRepair) {
      tabFullRepair.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.physics) {
          window.game.physics.repairVehicle();
        }
        this.showActionToast('✨ 100% FULL REPAIR', 'CHASSIS RESTORED & NITRO TOPPED', 2500);
      });
    }

    const tabCallTow = this.container.querySelector('#btn-tab-call-tow');
    if (tabCallTow) {
      tabCallTow.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTablet();
        this.callTowTruck();
      });
    }

    // 9. Performance App View Presets & Target FPS
    const setPreset = (preset) => {
      if (window.game && window.game.renderer && window.game.renderer.setQualityMode) {
        window.game.renderer.setQualityMode(preset);
        this.updatePresetButtons(preset);
        this.updateTargetText();
      }
    };
    const setTargetFps = (fps) => {
      gameState.targetFps = fps === 'uncapped' ? 'uncapped' : parseInt(fps, 10);
      gameState.fpsMode = String(fps);
      if (window.game && window.game.renderer && window.game.renderer.onTargetFpsChanged) {
        window.game.renderer.onTargetFpsChanged(gameState.targetFps);
      }
      this.updateFpsTargetButtons(fps);
      this.updateTargetText();
    };

    if (this.presetBtnPerf) this.presetBtnPerf.addEventListener('click', (e) => { e.stopPropagation(); setPreset('performance'); });
    if (this.presetBtnTurbo) this.presetBtnTurbo.addEventListener('click', (e) => { e.stopPropagation(); setPreset('turbo120'); });
    if (this.presetBtnBal) this.presetBtnBal.addEventListener('click', (e) => { e.stopPropagation(); setPreset('balanced'); });
    if (this.presetBtnHigh) this.presetBtnHigh.addEventListener('click', (e) => { e.stopPropagation(); setPreset('high'); });

    if (this.btnFps60) this.btnFps60.addEventListener('click', (e) => { e.stopPropagation(); setTargetFps(60); });
    if (this.btnFps120) this.btnFps120.addEventListener('click', (e) => { e.stopPropagation(); setTargetFps(120); });
    if (this.btnFps144) this.btnFps144.addEventListener('click', (e) => { e.stopPropagation(); setTargetFps(144); });
    if (this.btnFpsUncapped) this.btnFpsUncapped.addEventListener('click', (e) => { e.stopPropagation(); setTargetFps('uncapped'); });

    // 10. Historical Landmark Plaque Modal
    if (this.historyPromptPill) {
      this.historyPromptPill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (gameState.nearbyHistoryPlaque) {
          this.openHistoryModal(gameState.nearbyHistoryPlaque.id);
        }
      });
    }

    if (this.historyCloseBtn) {
      this.historyCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeHistoryModal();
      });
    }

    if (this.historyCloseFooterBtn) {
      this.historyCloseFooterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeHistoryModal();
      });
    }

    // 11. Inverted Recover Button
    const manualRescue = this.container.querySelector('#btn-manual-rescue');
    if (manualRescue) {
      manualRescue.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.physics) {
          window.game.physics.respawnOnRoad();
        }
      });
    }

    // 11b. Off-Road Stuck Recovery Button
    const stuckRescue = this.container.querySelector('#btn-stuck-rescue');
    const stuckAlert = this.container.querySelector('#hud-stuck-alert');
    const triggerStuckRescue = (e) => {
      e.stopPropagation();
      if (window.game && window.game.physics) {
        window.game.physics.respawnOnRoad();
      }
      if (this.stuckAlert) this.stuckAlert.classList.remove('show');
      this.showActionToast('🔄 ROAD RESCUE', 'VEHICLE PLACED CLEANLY ON HIGHWAY 1', 2500);
    };
    if (stuckRescue) stuckRescue.addEventListener('click', triggerStuckRescue);
    if (stuckAlert) stuckAlert.addEventListener('click', triggerStuckRescue);

    // 11c. Save & Progress App Actions
    const btnSaveNow = this.container.querySelector('#btn-tab-save-now');
    if (btnSaveNow) {
      btnSaveNow.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.saveManager) {
          const ok = window.game.saveManager.save(true);
          if (ok) {
            this.updateSaveGameView();
            this.showActionToast('💾 GAME SAVED', 'EXPEDITION SAVED TO BROWSER STORAGE', 2500);
          }
        }
      });
    }

    const btnExportJson = this.container.querySelector('#btn-tab-export-json');
    if (btnExportJson) {
      btnExportJson.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.game && window.game.saveManager) {
          window.game.saveManager.exportJson();
          this.showActionToast('📥 SAVE EXPORTED', 'BACKUP JSON DOWNLOADED', 2500);
        }
      });
    }

    const btnImportJson = this.container.querySelector('#btn-tab-import-json');
    const inputImportFile = this.container.querySelector('#input-tab-import-file');
    if (btnImportJson && inputImportFile) {
      btnImportJson.addEventListener('click', (e) => {
        e.stopPropagation();
        inputImportFile.click();
      });
      inputImportFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const res = window.game && window.game.saveManager && window.game.saveManager.importJson(evt.target.result);
              if (res && res.success) {
                const sData = res.data;
                if (window.game && window.game.physics && typeof sData.playerZ === 'number') {
                  if (window.game.physics.restorePosition) {
                    window.game.physics.restorePosition(sData.playerX, sData.playerZ, sData.playerHeading);
                  } else {
                    window.game.physics.respawnOnRoad(false, sData.playerZ);
                  }
                  if (window.game.sportsCar && window.game.sportsCar.group) {
                    window.game.sportsCar.group.position.copy(window.game.physics.position);
                    window.game.sportsCar.group.rotation.set(0, window.game.physics.heading, 0);
                  }
                }
                if (window.game && window.game.sportsCar && typeof sData.paintIndex === 'number' && window.game.sportsCar.paintPalette) {
                  const pIdx = Math.max(0, Math.min(window.game.sportsCar.paintPalette.length - 1, sData.paintIndex));
                  window.game.sportsCar.currentPaletteIndex = pIdx;
                  window.game.sportsCar.setPaintColor(window.game.sportsCar.paintPalette[pIdx].color, window.game.sportsCar.paintPalette[pIdx].name);
                }
                if (window.game && window.game.cameraManager) {
                  if (sData.cameraMode) window.game.cameraManager.setMode(sData.cameraMode);
                  window.game.cameraManager.resetTracking();
                }
                if (window.game && window.game.zoneManager && window.game.physics) {
                  window.game.zoneManager.update(window.game.physics.position);
                }
                this.updateSaveGameView();
                this.showActionToast('📤 PROGRESS RESTORED', `HYDRATED FROM ${file.name} (VER ${sData.version || 1})`, 3000);
              } else {
                alert('Failed to parse save file: ' + (res?.error || 'Unknown error'));
              }
            } catch (err) {
              alert('Error reading save file: ' + err.message);
            }
          };
          reader.readAsText(file);
        }
        inputImportFile.value = '';
      });
    }

    const btnResetRun = this.container.querySelector('#btn-tab-reset-run');
    if (btnResetRun) {
      btnResetRun.addEventListener('click', (e) => {
        e.stopPropagation();
        const conf = typeof window !== 'undefined' && window.confirm ? window.confirm('Are you sure you want to reset all progress and start a brand new run from Mojave Desert Zone 0?') : true;
        if (conf) {
          this.closeTablet();
          if (window.game && window.game.resetExpedition) {
            window.game.resetExpedition();
          } else {
            if (window.game && window.game.saveManager) {
              window.game.saveManager.clear();
            }
            gameState.reset();
            if (window.game && window.game.physics) {
              window.game.physics.respawnOnRoad(false, -14.0);
            }
            this.showActionToast('🔄 NEW EXPEDITION', 'PROGRESS RESET • RETURNING TO START', 3000);
          }
        }
      });
    }

    // 12. Scenic Highway Discovery Banner Click Assist & Reading
    if (this.scenicWaypoint) {
      this.scenicWaypoint.addEventListener('click', (e) => {
        if (e.target.closest('#scenic-waypoint-close')) return;
        e.stopPropagation();
        if (this._isInCurrentLot || gameState.nearbyHistoryPlaque) {
          const plaqueId = gameState.nearbyHistoryPlaque ? gameState.nearbyHistoryPlaque.id : (this._currentApproachingLot ? this._currentApproachingLot.id : null);
          if (plaqueId) this.openHistoryModal(plaqueId);
        } else if (this._currentApproachingLot && !this._isInCurrentLot) {
          if (this._physicsRef) {
            this._physicsRef.speed = Math.max(12, this._physicsRef.speed * 0.7);
          }
          this.showActionToast('🅿️ SCENIC OVERLOOK ASSIST', `SLOWING FOR ${this._currentApproachingLot.name.toUpperCase()}`, 2500);
        }
      });
    }

    // 12b. Scenic Highway Discovery Banner Dismiss Button
    if (this.scenicCloseBtn) {
      this.scenicCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this._scenicDismissedByUser = true;
        if (this.scenicWaypoint) {
          this.scenicWaypoint.classList.remove('visible');
          this.scenicWaypoint.classList.remove('in-lot');
          this.scenicWaypoint.classList.remove('pop-alert');
        }
      });
    }

    // 13. Initialize YouTube Tablet App & Highway Audio Player
    this.setupYouTubeApp();
  }

  setupYouTubeApp() {
    if (typeof window === 'undefined') return;

    // Initialize YouTube Player Host
    youtubePlayer.init();
    window.youtubePlayer = youtubePlayer;

    // Listen to state changes to update both Tablet deck and Car Stereo widget
    youtubePlayer.onStateChange((ytState) => {
      this.updateYouTubeDeck();
      this.updateCarStereoWidget();
    });

    // 1. Resume Driving & Listen Buttons (Header button and Mobile bottom action bar)
    const onDriveListen = (e) => {
      e.stopPropagation();
      this.closeTablet();
      this.showActionToast('🎵 YOUTUBE MUSIC', 'STREAMING AUDIO THROUGH CAR STEREO', 2500);
    };

    const driveBtn = this.container.querySelector('#yt-btn-drive-listen');
    if (driveBtn) {
      driveBtn.addEventListener('click', onDriveListen);
    }

    const driveMobileBtn = this.container.querySelector('#yt-btn-drive-listen-mobile');
    if (driveMobileBtn) {
      driveMobileBtn.addEventListener('click', onDriveListen);
    }

    // 2. Search Input & Action Buttons
    const searchInput = this.container.querySelector('#yt-search-input');
    const searchBtn = this.container.querySelector('#yt-search-submit-btn');
    const searchClear = this.container.querySelector('#yt-search-clear-btn');

    if (searchInput) {
      const doSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
          youtubePlayer.searchAndPlay(query);
          this.showActionToast('▶ STREAMING YOUTUBE', query.toUpperCase(), 2500);
        } else {
          this.populateYouTubeTracks('all');
        }
      };

      searchInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          doSearch();
        }
      });

      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim();
        if (searchClear) searchClear.style.display = q ? 'block' : 'none';
        this.handleYouTubeSearch(q);
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const q = searchInput ? searchInput.value.trim() : '';
        if (q) {
          youtubePlayer.searchAndPlay(q);
          this.showActionToast('▶ STREAMING YOUTUBE', q.toUpperCase(), 2500);
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', (e) => {
        e.stopPropagation();
        if (searchInput) {
          searchInput.value = '';
          searchClear.style.display = 'none';
          this.populateYouTubeTracks('all');
          const customCard = this.container.querySelector('#yt-custom-search-card');
          if (customCard) customCard.style.display = 'none';
        }
      });
    }

    // 3. Genre Filter Tabs
    this.container.querySelectorAll('.yt-genre-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        this.container.querySelectorAll('.yt-genre-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const genre = tab.getAttribute('data-yt-genre') || 'all';
        this.populateYouTubeTracks(genre);
      });
    });

    // 4. Now Playing Deck Controls
    const playToggle = this.container.querySelector('#yt-btn-play-toggle');
    if (playToggle) {
      playToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        youtubePlayer.togglePlay();
      });
    }

    const btnPrev = this.container.querySelector('#yt-btn-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        youtubePlayer.prevTrack();
      });
    }

    const btnNext = this.container.querySelector('#yt-btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        youtubePlayer.nextTrack();
      });
    }

    const btnMute = this.container.querySelector('#yt-btn-mute-toggle');
    if (btnMute) {
      btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        youtubePlayer.toggleMute();
      });
    }

    const volSlider = this.container.querySelector('#yt-volume-slider');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        youtubePlayer.setVolume(parseFloat(e.target.value));
      });
    }

    // 5. Custom Search Play Action Card
    const customPlayBtn = this.container.querySelector('#yt-custom-search-play-btn');
    if (customPlayBtn) {
      customPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const q = searchInput ? searchInput.value.trim() : '';
        if (q) {
          youtubePlayer.searchAndPlay(q);
          this.showActionToast('▶ STREAMING YOUTUBE', q.toUpperCase(), 2500);
        }
      });
    }

    // 6. In-Car Driving Stereo Widget Controls
    const stereoPlayBtn = this.container.querySelector('#yt-stereo-play-btn');
    if (stereoPlayBtn) {
      stereoPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (youtubePlayer._isPlayingConfirmed && gameState.youtubeApp.isPlaying) {
          youtubePlayer.pause();
        } else {
          youtubePlayer.ensurePlaying();
          youtubePlayer.resume();
        }
      });
    }

    const stereoMuteBtn = this.container.querySelector('#yt-stereo-mute-btn');
    if (stereoMuteBtn) {
      stereoMuteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        youtubePlayer.toggleMute();
      });
    }

    const stereoTabletBtn = this.container.querySelector('#yt-stereo-tablet-btn');
    if (stereoTabletBtn) {
      stereoTabletBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTablet('home');
      });
    }

    const stereoDisplay = this.container.querySelector('.yt-stereo-display');
    if (stereoDisplay) {
      stereoDisplay.setAttribute('title', 'Open YouTube Music Tablet App');
      stereoDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTablet('youtube');
      });
    }

    const stereoBadge = this.container.querySelector('.yt-stereo-badge');
    if (stereoBadge) {
      stereoBadge.setAttribute('title', 'Open YouTube Music Tablet App');
      stereoBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTablet('youtube');
      });
    }

    const stereoCloseBtn = this.container.querySelector('#yt-stereo-close-btn');
    if (stereoCloseBtn) {
      stereoCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        gameState.youtubeApp.isStereoWidgetVisible = false;
        const stereo = this.container.querySelector('#youtube-car-stereo');
        if (stereo) stereo.style.display = 'none';
        youtubePlayer.setDockMode('driving');
      });
    }

    // Window resize tracking for docked YouTube player in tablet
    window.addEventListener('resize', () => {
      if (gameState.isTabletOpen && gameState.activeTabletApp === 'youtube') {
        this.dockYouTubeInTablet();
      }
    });

    // Instant scroll tracking for docked YouTube player in tablet scroll container
    const ytScroll = this.container.querySelector('.yt-scroll-container');
    if (ytScroll) {
      ytScroll.addEventListener('scroll', () => {
        if (gameState.isTabletOpen && gameState.activeTabletApp === 'youtube') {
          this.dockYouTubeInTablet();
        }
      }, { passive: true });
    }

    // Expedition Resume Prompt Buttons
    const btnResumeContinue = this.container.querySelector('#btn-resume-continue');
    if (btnResumeContinue) {
      btnResumeContinue.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideResumePrompt();
        if (this._resumeOnContinue) this._resumeOnContinue();
        if (this.onStartCallback && !this._hasStarted) {
          this._hasStarted = true;
          this.onStartCallback();
        }
      });
    }

    const btnResumeFresh = this.container.querySelector('#btn-resume-fresh');
    if (btnResumeFresh) {
      btnResumeFresh.addEventListener('click', (e) => {
        e.stopPropagation();
        const conf = typeof window !== 'undefined' && window.confirm
          ? window.confirm('Reset all progress and start fresh from the beginning (Zone 0 Mojave Desert)?')
          : true;
        if (conf) {
          this.hideResumePrompt();
          if (this._resumeOnReset) this._resumeOnReset();
          if (this.onStartCallback && !this._hasStarted) {
            this._hasStarted = true;
            this.onStartCallback();
          }
        }
      });
    }

    // Top Bar Pause Menu Button
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePauseMenu();
      });
    }

    // Pause Menu Modal Actions
    const btnPauseResume = this.container.querySelector('#btn-pause-resume');
    if (btnPauseResume) {
      btnPauseResume.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePauseMenu();
      });
    }

    const btnPauseTablet = this.container.querySelector('#btn-pause-tablet');
    if (btnPauseTablet) {
      btnPauseTablet.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePauseMenu();
        this.openTablet('home');
      });
    }

    const btnPauseRescue = this.container.querySelector('#btn-pause-rescue');
    if (btnPauseRescue) {
      btnPauseRescue.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePauseMenu();
        if (window.game && window.game.physics) {
          window.game.physics.respawnOnRoad();
        }
      });
    }

    const btnPauseReset = this.container.querySelector('#btn-pause-reset-fresh');
    if (btnPauseReset) {
      btnPauseReset.addEventListener('click', (e) => {
        e.stopPropagation();
        const conf = typeof window !== 'undefined' && window.confirm
          ? window.confirm('Reset all expedition progress and restart from the beginning (Zone 0 Mojave Desert)?')
          : true;
        if (conf) {
          this.closePauseMenu();
          if (window.game && window.game.resetExpedition) {
            window.game.resetExpedition();
          }
        }
      });
    }

    // Clicking pause modal backdrop closes pause menu
    if (this.pauseBackdrop) {
      this.pauseBackdrop.addEventListener('click', (e) => {
        if (e.target === this.pauseBackdrop) {
          this.closePauseMenu();
        }
      });
    }

    // Initial render
    this.populateYouTubeTracks('all');
    this.updateYouTubeDeck();
  }

  async handleYouTubeSearch(query) {
    const customCard = this.container.querySelector('#yt-custom-search-card');
    const customTitle = this.container.querySelector('#yt-custom-query-title');

    if (!query) {
      if (customCard) customCard.style.display = 'none';
      this.populateYouTubeTracks('all');
      return;
    }

    // If query looks like a custom search or URL, display custom prompt card
    if (customCard && customTitle) {
      customCard.style.display = 'flex';
      const isUrl = extractYouTubeVideoId(query);
      if (isUrl) {
        customTitle.textContent = `Direct YouTube Video ID: ${isUrl}`;
      } else {
        customTitle.textContent = `Play "${query}" on YouTube`;
      }
    }

    // 1. Instant local filter
    const filtered = youtubePlayer.filterCatalog(query);
    if (filtered.length > 0) {
      this.renderYouTubeTrackGrid(filtered);
    }

    // 2. Fetch full search results (curated + direct + YouTube suggestions)
    this._searchQueryToken = query;
    try {
      const allResults = await youtubePlayer.searchAll(query);
      if (this._searchQueryToken === query && allResults && allResults.length > 0) {
        this.renderYouTubeTrackGrid(allResults);
      }
    } catch (e) {}
  }

  populateYouTubeTracks(genre = 'all') {
    const tracks = youtubePlayer.getCuratedCatalog(genre);
    this.renderYouTubeTrackGrid(tracks);
  }

  renderYouTubeTrackGrid(tracks) {
    const grid = this.container.querySelector('#yt-track-grid');
    if (!grid) return;

    const countLabel = this.container.querySelector('#yt-catalog-count-label');
    if (countLabel) {
      countLabel.textContent = `${tracks.length} Video${tracks.length === 1 ? '' : 's'} / Result${tracks.length === 1 ? '' : 's'}`;
    }

    grid.innerHTML = '';
    tracks.forEach(track => {
      const card = document.createElement('div');
      card.className = 'yt-track-card';
      if (gameState.youtubeApp && (
        (track.id && gameState.youtubeApp.currentVideoId === track.id) ||
        (track.searchQuery && gameState.youtubeApp.searchQuery === track.searchQuery)
      )) {
        card.classList.add('active');
      }

      card.innerHTML = `
        <div class="yt-track-thumb-box">
          <img class="yt-track-thumb" src="${track.thumbnail || 'https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg'}" alt="${track.title}" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg';" />
          <span class="yt-track-duration">${track.duration || 'Stream'}</span>
          <span class="yt-track-tag">${track.tag || track.genre || 'YouTube'}</span>
        </div>
        <div class="yt-track-details">
          <div class="yt-track-meta">
            <div class="yt-track-title">${track.title}</div>
            <div class="yt-track-artist">${track.artist || 'YouTube'}</div>
          </div>
          <div class="yt-track-play-badge">▶ PLAY</div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        this.container.querySelectorAll('.yt-track-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (track.id) {
          youtubePlayer.playTrack(track);
        } else if (track.searchQuery) {
          youtubePlayer.searchAndPlay(track.searchQuery);
        } else {
          youtubePlayer.playTrack(track);
        }
        this.showActionToast('▶ NOW STREAMING', `${(track.title || '').toUpperCase()}`, 2500);
      });

      grid.appendChild(card);
    });
  }

  updateYouTubeDeck() {
    const ytState = gameState.youtubeApp;
    if (!ytState) return;

    const title = this.container.querySelector('#yt-deck-title');
    const artist = this.container.querySelector('#yt-deck-artist');
    const playBtn = this.container.querySelector('#yt-btn-play-toggle');
    const statusPill = this.container.querySelector('#yt-tab-live-status');
    const deckState = this.container.querySelector('#yt-deck-playing-state');
    const spectrum = this.container.querySelector('#yt-spectrum-indicator');
    const muteBtn = this.container.querySelector('#yt-btn-mute-toggle');
    const volSlider = this.container.querySelector('#yt-volume-slider');

    if (title) title.textContent = ytState.currentTitle || 'No Track Selected';
    if (artist) artist.textContent = ytState.currentArtist || 'Pick a song to play';
    if (playBtn) playBtn.textContent = ytState.isPlaying ? '⏸' : '▶';
    if (muteBtn) muteBtn.textContent = ytState.isMuted ? '🔇' : '🔊';
    if (volSlider && document.activeElement !== volSlider) volSlider.value = ytState.volume ?? 100;

    if (statusPill) {
      statusPill.textContent = ytState.isPlaying ? '🔴 LIVE STREAMING' : 'READY TO PLAY';
      statusPill.style.color = ytState.isPlaying ? '#ef4444' : '#4ade80';
      statusPill.style.borderColor = ytState.isPlaying ? '#ef4444' : '#22c55e';
    }

    if (deckState) {
      deckState.textContent = ytState.isPlaying ? 'NOW PLAYING' : 'PAUSED';
      deckState.style.color = ytState.isPlaying ? '#ef4444' : '#94a3b8';
    }

    if (spectrum) {
      spectrum.style.opacity = ytState.isPlaying ? '1' : '0.2';
    }

    const extLink = this.container.querySelector('#yt-deck-external-link');
    if (extLink && ytState.currentVideoId) {
      extLink.href = `https://www.youtube.com/watch?v=${ytState.currentVideoId}`;
    }
  }

  updateCarStereoWidget() {
    const stereo = this.container.querySelector('#youtube-car-stereo');
    if (!stereo) return;

    const ytState = gameState.youtubeApp;
    if (!ytState || !ytState.isStereoWidgetVisible || (!ytState.isPlaying && !ytState.currentVideoId && !ytState.searchQuery)) {
      stereo.style.display = 'none';
      return;
    }

    // Only show while driving (tablet is closed)
    if (gameState.isTabletOpen) {
      stereo.style.display = 'none';
      return;
    }

    stereo.style.display = 'flex';

    const text = this.container.querySelector('#yt-stereo-text');
    const playBtn = this.container.querySelector('#yt-stereo-play-btn');
    const muteBtn = this.container.querySelector('#yt-stereo-mute-btn');
    const bars = this.container.querySelector('#yt-stereo-bars');

    if (text) {
      text.textContent = `${ytState.currentTitle || 'YouTube'} • ${ytState.currentArtist || 'Highway Radio'}`;
    }
    if (playBtn) {
      playBtn.textContent = ytState.isPlaying ? '⏸' : '▶';
    }
    if (muteBtn) {
      muteBtn.textContent = ytState.isMuted ? '🔇' : '🔊';
    }
    if (bars) {
      bars.style.opacity = ytState.isPlaying ? '1' : '0.2';
    }
  }

  dockYouTubeInTablet() {
    const host = document.getElementById('youtube-persistent-container');
    if (!host) return;

    if (!gameState.isTabletOpen || gameState.activeTabletApp !== 'youtube') {
      if (this._ytWasHidden !== 'driving') {
        this._ytWasHidden = 'driving';
        this._lastYtDockBounds = null;
        host.className = 'yt-driving-mode';
        host.style.position = 'fixed';
        host.style.left = '-9999px';
        host.style.top = '-9999px';
        host.style.width = '200px';
        host.style.height = '200px';
        host.style.opacity = '0.001';
        host.style.pointerEvents = 'none';
        host.style.zIndex = '-10';
        host.style.clipPath = 'none';
      }
      return;
    }

    const anchor = this.container.querySelector('#yt-dock-target');
    if (!anchor) return;

    const scrollContainer = this.container.querySelector('.yt-scroll-container');
    const scrollRect = scrollContainer ? scrollContainer.getBoundingClientRect() : null;
    const rect = anchor.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) return;

    // Check if the deck screen anchor is completely outside the visible scrollable area of the tablet
    const isOutAbove = scrollRect ? (rect.bottom <= scrollRect.top) : false;
    const isOutBelow = scrollRect ? (rect.top >= scrollRect.bottom) : false;
    const isOutLeft = scrollRect ? (rect.right <= scrollRect.left) : false;
    const isOutRight = scrollRect ? (rect.left >= scrollRect.right) : false;

    if (isOutAbove || isOutBelow || isOutLeft || isOutRight) {
      if (this._ytWasHidden !== 'scrolled-away') {
        this._ytWasHidden = 'scrolled-away';
        this._lastYtDockBounds = null;
        host.className = 'yt-tablet-mode yt-tablet-hidden';
        host.style.position = 'fixed';
        host.style.left = '-9999px';
        host.style.top = '-9999px';
        host.style.width = `${rect.width}px`;
        host.style.height = `${rect.height}px`;
        host.style.opacity = '0';
        host.style.pointerEvents = 'none';
        host.style.zIndex = '-10';
        host.style.clipPath = 'none';
      }
      return;
    }

    // Calculate edge clippings when partially scrolling underneath the tablet header or bottom bar
    let clipTop = 0;
    let clipBottom = 0;
    let clipLeft = 0;
    let clipRight = 0;

    if (scrollRect) {
      clipTop = Math.max(0, scrollRect.top - rect.top);
      clipBottom = Math.max(0, rect.bottom - scrollRect.bottom);
      clipLeft = Math.max(0, scrollRect.left - rect.left);
      clipRight = Math.max(0, rect.right - scrollRect.right);
    }

    // If completely clipped out by insets
    if (clipTop >= rect.height || clipBottom >= rect.height || clipLeft >= rect.width || clipRight >= rect.width) {
      if (this._ytWasHidden !== 'scrolled-away') {
        this._ytWasHidden = 'scrolled-away';
        this._lastYtDockBounds = null;
        host.className = 'yt-tablet-mode yt-tablet-hidden';
        host.style.position = 'fixed';
        host.style.left = '-9999px';
        host.style.top = '-9999px';
        host.style.opacity = '0';
        host.style.pointerEvents = 'none';
        host.style.zIndex = '-10';
        host.style.clipPath = 'none';
      }
      return;
    }

    // Format bounds key for 60 FPS dirty-checking to avoid DOM style thrashing
    const boundsKey = `${rect.left.toFixed(1)}_${rect.top.toFixed(1)}_${rect.width.toFixed(1)}_${rect.height.toFixed(1)}_${clipTop.toFixed(1)}_${clipBottom.toFixed(1)}_${clipLeft.toFixed(1)}_${clipRight.toFixed(1)}`;
    if (this._lastYtDockBounds === boundsKey && this._ytWasHidden === false) {
      return; // No layout/position changes this frame; preserve 60 FPS
    }

    this._lastYtDockBounds = boundsKey;
    this._ytWasHidden = false;

    host.className = 'yt-tablet-mode';
    host.style.position = 'fixed';
    host.style.left = `${rect.left}px`;
    host.style.top = `${rect.top}px`;
    host.style.width = `${rect.width}px`;
    host.style.height = `${rect.height}px`;
    host.style.right = 'auto';
    host.style.bottom = 'auto';
    host.style.zIndex = '350';
    host.style.opacity = '1';
    host.style.pointerEvents = 'auto';

    if (clipTop > 0 || clipBottom > 0 || clipLeft > 0 || clipRight > 0) {
      host.style.clipPath = `inset(${Math.ceil(clipTop)}px ${Math.ceil(clipRight)}px ${Math.ceil(clipBottom)}px ${Math.ceil(clipLeft)}px round 10px)`;
    } else {
      host.style.clipPath = 'none';
    }
  }

  setSoundEngine(soundEngine) {
    this.soundEngine = soundEngine;
  }

  setPhysics(physics) {
    this._physicsRef = physics;
    if (physics) physics.hud = this;
  }

  // 🏔️ 4x4 Off-Road Telemetry Modal Management
  toggleTelemetry() {
    if (this.isTelemetryOpen) {
      this.closeTelemetry();
    } else {
      this.openTelemetry();
    }
  }

  openTelemetry() {
    if (this.tabletModal && gameState.isTabletOpen) {
      this.closeTablet();
    }
    this.isTelemetryOpen = true;
    if (this.offroadCluster) this.offroadCluster.classList.add('open');
    if (this.offroadBackdrop) this.offroadBackdrop.classList.add('open');
    if (this.telemetryBtn) this.telemetryBtn.classList.add('active');
  }

  closeTelemetry() {
    this.isTelemetryOpen = false;
    if (this.offroadCluster) this.offroadCluster.classList.remove('open');
    if (this.offroadBackdrop) this.offroadBackdrop.classList.remove('open');
    if (this.telemetryBtn) this.telemetryBtn.classList.remove('active');
  }

  // Tablet Management
  toggleTablet(appId) {
    if (gameState.isTabletOpen) {
      this.closeTablet();
    } else {
      this.openTablet(appId || 'home');
    }
  }

  openTablet(appId = 'home') {
    if (!this.tabletModal) return;
    if (this.isTelemetryOpen) {
      this.closeTelemetry();
    }
    gameState.isTabletOpen = true;
    this.tabletModal.classList.add('open');
    this.openTabletApp(appId);
    this.updateTabletLiveTelemetry();
    // Hide in-car driving stereo widget while tablet is open
    const stereo = this.container.querySelector('#youtube-car-stereo');
    if (stereo) stereo.style.display = 'none';
  }

  closeTablet() {
    if (!this.tabletModal) return;
    gameState.isTabletOpen = false;
    this.tabletModal.classList.remove('open');

    // Restore audio-only driving mode for YouTube player (video hidden off-screen)
    if (typeof window !== 'undefined' && window.youtubePlayer) {
      window.youtubePlayer.setDockMode('driving');
      this.updateCarStereoWidget();
    }
    this.dockYouTubeInTablet();
  }

  openTabletApp(appId) {
    if (appId === 'offroad-telemetry') {
      this.closeTablet();
      this.openTelemetry();
      return;
    }
    gameState.activeTabletApp = appId;
    this.tabletViews.forEach(view => {
      view.classList.remove('active');
    });

    const targetView = this.container.querySelector(`#tab-view-${appId}`);
    if (targetView) {
      targetView.classList.add('active');
    } else {
      const home = this.container.querySelector('#tab-view-home');
      if (home) home.classList.add('active');
    }

    // App-specific initialization
    if (appId === 'camera') {
      this.updateCameraCards(gameState.cameraMode);
    } else if (appId === 'weather') {
      this.updateWeatherCards(gameState.debugRainMode || 'auto');
    } else if (appId === 'lore') {
      this.populateLoreList();
    } else if (appId === 'casefiles') {
      this.populateCaseFiles();
    } else if (appId === 'savegame') {
      this.updateSaveGameView();
    } else if (appId === 'youtube') {
      this.populateYouTubeTracks('all');
      this.updateYouTubeDeck();
      this._lastYtDockBounds = null;
      this._ytWasHidden = null;
      if (typeof window !== 'undefined' && window.youtubePlayer) {
        window.youtubePlayer.setDockMode('tablet');
        setTimeout(() => this.dockYouTubeInTablet(), 50);
      }
    } else {
      if (typeof window !== 'undefined' && window.youtubePlayer) {
        window.youtubePlayer.setDockMode('driving');
      }
      this.dockYouTubeInTablet();
    }
  }

  updateCameraCards(mode) {
    this.container.querySelectorAll('[data-cam-mode]').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-cam-mode') === mode);
    });
  }

  updateWeatherCards(mode) {
    this.container.querySelectorAll('[data-weather-mode]').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-weather-mode') === mode);
    });
  }

  updateLiveryCards(hex) {
    this.container.querySelectorAll('[data-paint-hex]').forEach(card => {
      const cardHex = parseInt(card.getAttribute('data-paint-hex'), 16);
      card.classList.toggle('active', cardHex === hex);
    });
  }

  updatePresetButtons(preset) {
    if (this.presetBtnPerf) this.presetBtnPerf.classList.toggle('active', preset === 'performance');
    if (this.presetBtnTurbo) this.presetBtnTurbo.classList.toggle('active', preset === 'turbo120');
    if (this.presetBtnBal) this.presetBtnBal.classList.toggle('active', preset === 'balanced');
    if (this.presetBtnHigh) this.presetBtnHigh.classList.toggle('active', preset === 'high');
  }

  updateFpsTargetButtons(fps) {
    const s = String(fps);
    if (this.btnFps60) this.btnFps60.classList.toggle('active', s === '60');
    if (this.btnFps120) this.btnFps120.classList.toggle('active', s === '120');
    if (this.btnFps144) this.btnFps144.classList.toggle('active', s === '144');
    if (this.btnFpsUncapped) this.btnFpsUncapped.classList.toggle('active', s === 'uncapped');
  }

  updateTargetText() {
    if (!this.perfTargetText) return;
    const target = gameState.targetFps;
    if (target === 'uncapped') {
      this.perfTargetText.textContent = 'Target: Display Max (Uncapped)';
    } else {
      const fps = typeof target === 'number' ? target : parseInt(target, 10) || 120;
      const ms = (1000 / fps).toFixed(1);
      this.perfTargetText.textContent = `Target: ${ms}ms (${fps} FPS)`;
    }
  }

  updateSaveGameView() {
    const zone = ZONES[gameState.currentZoneIndex] || ZONES[0];
    const playerZ = (this._physicsRef && this._physicsRef.position) ? Math.round(this._physicsRef.position.z) : 0;
    const distM = Math.round(gameState.distanceMeters || 0);
    const score = Math.round(gameState.score || 0);
    const shields = `${gameState.route66ShieldsCollected || 0} / ${gameState.totalRoute66Shields || 5}`;
    const clues = gameState.mysteryMission ? `${gameState.mysteryMission.cluesFound || 0} / ${gameState.mysteryMission.totalClues || 9} FOUND` : '0 / 9 FOUND';
    const integrity = Math.round(gameState.carIntegrity !== undefined ? gameState.carIntegrity : 100);
    const loreCount = `${(gameState.discoveredHistoryPlaques ? gameState.discoveredHistoryPlaques.size : 0)} DISCOVERED`;

    const elZone = this.container.querySelector('#tab-save-zone');
    if (elZone) elZone.textContent = `ZONE ${gameState.currentZoneIndex} • ${zone.name.toUpperCase()}`;

    const elCoord = this.container.querySelector('#tab-save-coord');
    if (elCoord) elCoord.textContent = `Z = ${playerZ}m (${(distM / 1000).toFixed(1)} km traveled)`;

    const elScore = this.container.querySelector('#tab-save-score');
    if (elScore) elScore.textContent = `${score.toLocaleString()} PTS`;

    const elShields = this.container.querySelector('#tab-save-shields');
    if (elShields) elShields.textContent = shields;

    const elClues = this.container.querySelector('#tab-save-clues');
    if (elClues) elClues.textContent = clues;

    const elIntegrity = this.container.querySelector('#tab-save-integrity');
    if (elIntegrity) {
      elIntegrity.textContent = `${integrity}% ${integrity < 20 ? 'CRITICAL' : (integrity < 50 ? 'DAMAGED' : 'OK')}`;
      elIntegrity.style.color = integrity < 20 ? '#ef4444' : (integrity < 50 ? '#facc15' : '#22c55e');
    }

    const elLore = this.container.querySelector('#tab-save-lore');
    if (elLore) elLore.textContent = loreCount;

    const elTime = this.container.querySelector('#tab-save-time');
    const badge = this.container.querySelector('#tab-save-status-badge');
    const sm = typeof window !== 'undefined' && window.game && window.game.saveManager;
    if (sm && sm.hasSave()) {
      const d = sm.lastSaveTime ? new Date(sm.lastSaveTime) : new Date();
      if (elTime) elTime.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (badge) {
        badge.textContent = 'SAVED LOCALLY';
        badge.style.color = '#10b981';
      }
    } else {
      if (elTime) elTime.textContent = 'NOT SAVED YET';
      if (badge) {
        badge.textContent = 'AUTO-SAVING SOON';
        badge.style.color = '#f59e0b';
      }
    }
  }

  populateLoreList() {
    const list = this.container.querySelector('#tab-lore-list');
    const countEl = this.container.querySelector('#tab-lore-count');
    if (!list) return;

    const discovered = gameState.discoveredHistoryPlaques ? gameState.discoveredHistoryPlaques.size : 0;
    if (countEl) countEl.textContent = `${discovered} / ${TOTAL_HISTORICAL_ARCHIVES} DISCOVERED`;

    list.innerHTML = '';
    const entries = Object.values(HISTORICAL_LORE_DATABASE);

    entries.forEach(lore => {
      const isDiscovered = gameState.discoveredHistoryPlaques ? gameState.discoveredHistoryPlaques.has(lore.id) : false;
      const photos = (lore.photos && lore.photos.length > 0) ? lore.photos : getLandmarkPhotos(lore.id);
      const thumbUrl = photos[0]?.url || '';

      const item = document.createElement('div');
      item.style.cssText = 'background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; cursor: pointer; transition: background 0.2s ease;';
      item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.08)');
      item.addEventListener('mouseleave', () => item.style.background = 'rgba(255,255,255,0.04)');

      const thumbHtml = thumbUrl
        ? `<div style="width: 54px; height: 38px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background: #000; border: 1px solid rgba(245,158,11,0.35);"><img src="${thumbUrl}" alt="${lore.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" /></div>`
        : `<div style="width: 54px; height: 38px; border-radius: 6px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">🏛️</div>`;

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          ${thumbHtml}
          <div style="min-width: 0; flex: 1;">
            <div style="font-size: 10.5px; font-weight: 900; color: #ffd152; letter-spacing: 0.5px;">ZONE ${lore.zone} • ${(lore.zoneName || '').toUpperCase()}</div>
            <div style="font-size: 13px; font-weight: 700; color: #f8fafc; word-break: break-word; line-height: 1.3;">${lore.name}</div>
            <div style="font-size: 11px; color: #94a3b8; word-break: break-word; line-height: 1.3; margin-top: 2px;">${lore.sub || ''}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
          <span style="font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${isDiscovered ? 'background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3);' : 'background: rgba(148,163,184,0.1); color: #94a3b8;'}">${isDiscovered ? '★ DISCOVERED' : 'UNVISITED'}</span>
          <button class="dev-tool-btn dev-btn-primary" style="font-size: 10px; padding: 4px 10px;">VIEW & PHOTOS</button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHistoryModal(lore.id);
      });

      list.appendChild(item);
    });
  }

  populateCaseFiles() {
    const body = this.container.querySelector('#tab-casefiles-body');
    const badge = this.container.querySelector('#tab-case-status-badge');
    if (!body) return;

    const mission = gameState.mysteryMission || {
      state: 'unstarted',
      witnessedMurder: false,
      cluesFound: 0,
      totalClues: 9,
      clues: {},
      reportedToPolice: false
    };

    if (badge) {
      if (mission.state === 'solved') {
        badge.textContent = mission.reportingStation === 'Washington' ? 'CASE CLOSED • FEDS SOLVED' : 'CASE CLOSED • SOLVED';
        badge.style.color = '#10b981';
      } else if (mission.witnessedMurder) {
        badge.textContent = 'ACTIVE INVESTIGATION';
        badge.style.color = '#f59e0b';
      } else {
        badge.textContent = 'UNWITNESSED';
        badge.style.color = '#ef4444';
      }
    }

    const isWitnessed = mission.witnessedMurder;
    const isReported = mission.reportedToPolice;
    const totalClues = mission.totalClues || 9;
    const clueIcons = ['📁', '🚗', '📱', '💼', '📻', '✈️', '📦', '📡', '🎯'];

    const clueRowsHtml = (ZONE_CLUES_CONFIG || []).map((cfg, idx) => {
      const isFound = Boolean(mission.clues && mission.clues[cfg.key]);
      const icon = clueIcons[idx % clueIcons.length];
      return `
        <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid ${isFound ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
          <div style="font-size: 20px;">${isFound ? '✅' : icon}</div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 13px; font-weight: 800; color: ${isFound ? '#34d399' : '#fff'};">${idx + 1}. Zone ${cfg.zone}: ${cfg.name}</div>
              <span style="font-size: 10px; font-weight: 800; color: ${isFound ? '#10b981' : (isWitnessed ? '#38bdf8' : '#94a3b8')};">${isFound ? 'FOUND (+500 PTS)' : (isWitnessed ? 'SEARCH ZONE' : 'LOCKED')}</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">${cfg.locName} &bull; ${cfg.desc}</div>
          </div>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%); border: 2px solid ${mission.state === 'solved' ? 'rgba(16, 185, 129, 0.6)' : (isWitnessed ? 'rgba(245, 158, 11, 0.6)' : 'rgba(239, 68, 68, 0.6)')}; border-radius: 14px; padding: 14px 18px; box-shadow: 0 6px 20px rgba(0,0,0,0.5); margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 10px; font-weight: 900; letter-spacing: 1.5px; color: #ef4444;">INCIDENT DOSSIER #94-B</div>
            <div style="font-size: 16px; font-weight: 900; color: #fff; margin-top: 1px;">HIGHWAY 1 MOB HIT & TRANS-STATE SYNDICATE</div>
          </div>
          <div style="padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; background: ${mission.state === 'solved' ? '#065f46; color: #6ee7b7' : (isWitnessed ? '#78350f; color: #fde68a' : '#7f1d1d; color: #fca5a5')};">
            ${mission.state === 'solved' ? `★ RESOLVED (+${(mission.rewardPoints || 5000).toLocaleString()} PTS)` : (isWitnessed ? '🕵️ IN PROGRESS' : '⚠️ UNWITNESSED')}
          </div>
        </div>
        <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 10px;">
          ${isWitnessed
            ? 'Surveillance from the Cougar Ridge Summit observation binoculars confirmed an armed mob execution. The shooter and boss escaped down Highway 1. Find physical syndicate clues hidden across all 9 zones and deliver evidence to Law Enforcement.'
            : 'Unconfirmed reports of illicit Syndicate activity in the secluded canyons below Cougar Ridge. Climb the 4x4 trail to Cougar Ridge Summit (Z=1,100m, Elev 56m) and look through the East Binoculars to surveil the desert valley.'}
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
          <div>
            <div style="font-size: 9px; color: #64748b; font-weight: 800;">PRIMARY CRIME SCENE</div>
            <div style="font-size: 11px; color: #e2e8f0; font-weight: 700;">Zone 0: Arrowhead Gully</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #64748b; font-weight: 800;">EVIDENCE FOUND</div>
            <div style="font-size: 11px; color: #38bdf8; font-weight: 700;">${mission.cluesFound} / ${totalClues} COLLECTED</div>
          </div>
          <div>
            <div style="font-size: 9px; color: #64748b; font-weight: 800;">REPORTING PRECINCTS</div>
            <div style="font-size: 11px; color: #facc15; font-weight: 700;">Malibu (Z=5k) or Fed HQ (Z=22.8k)</div>
          </div>
        </div>
      </div>

      <div style="font-size: 12px; font-weight: 900; color: #f8fafc; letter-spacing: 1px; margin: 10px 0 6px 0;">INCIDENT SURVEILLANCE & TRIGGER</div>

      <!-- Trigger Step -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid ${isWitnessed ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="font-size: 20px;">${isWitnessed ? '✅' : '🔭'}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 800; color: ${isWitnessed ? '#34d399' : '#fff'};">Surveil Desert Gully Execution</div>
            <span style="font-size: 10px; font-weight: 800; color: ${isWitnessed ? '#10b981' : '#94a3b8'};">${isWitnessed ? 'WITNESSED' : 'PENDING'}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">Cougar Ridge Summit Viewfinder &bull; Aim at Arrowhead Canyon to trigger cinematic murder scene</div>
        </div>
      </div>

      <div style="font-size: 12px; font-weight: 900; color: #f8fafc; letter-spacing: 1px; margin: 10px 0 6px 0;">DISCOVERABLE PHYSICAL CLUES (ALL 9 ZONES)</div>

      ${clueRowsHtml}

      <div style="font-size: 12px; font-weight: 900; color: #f8fafc; letter-spacing: 1px; margin: 14px 0 6px 0;">LAW ENFORCEMENT REPORTING PRECINCTS</div>

      <!-- Precinct 1 -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid ${(isReported && mission.reportingStation === 'Malibu') ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
        <div style="font-size: 20px;">${(isReported && mission.reportingStation === 'Malibu') ? '✅' : '🚔'}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 800; color: ${(isReported && mission.reportingStation === 'Malibu') ? '#34d399' : '#fff'};">Option A: Malibu Sheriff & CHP Precinct</div>
            <span style="font-size: 10px; font-weight: 800; color: ${(isReported && mission.reportingStation === 'Malibu') ? '#10b981' : (isWitnessed ? '#38bdf8' : '#94a3b8')};">${(isReported && mission.reportingStation === 'Malibu') ? 'REPORTED' : (isWitnessed ? 'DROP OFF READY' : 'LOCKED')}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">Zone 1 (Z=5,050m) &bull; Pull onto Evidence Apron &bull; Reward: Up to +15,000 PTS</div>
        </div>
      </div>

      <!-- Precinct 2 -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid ${(isReported && mission.reportingStation === 'Washington') ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 20px;">${(isReported && mission.reportingStation === 'Washington') ? '✅' : '🏛️'}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 800; color: ${(isReported && mission.reportingStation === 'Washington') ? '#34d399' : '#fff'};">Option B: Washington Federal Regional HQ</div>
            <span style="font-size: 10px; font-weight: 800; color: ${(isReported && mission.reportingStation === 'Washington') ? '#10b981' : (isWitnessed ? '#38bdf8' : '#94a3b8')};">${(isReported && mission.reportingStation === 'Washington') ? 'REPORTED' : (isWitnessed ? 'DROP OFF READY' : 'LOCKED')}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">Zone 8 (Z=22,800m) &bull; Federal State Patrol Headquarters &bull; Master Detective Commendation</div>
        </div>
      </div>
    `;
  }

  // Compatibility Wrappers for Zone & Dev Menus
  openDevMenu() {
    this.openTablet('zones');
  }

  closeDevMenu() {
    this.closeTablet();
  }

  toggleDevMenu() {
    this.toggleTablet('zones');
  }

  openZoneMenu() {
    this.openTablet('milestones');
  }

  closeZoneMenu() {
    this.closeTablet();
  }

  toggleZoneMenu() {
    this.toggleTablet('milestones');
  }

  toggleUI() {
    this.isUIHidden = !this.isUIHidden;
    if (this.isUIHidden) {
      this.container.classList.add('hud-ui-hidden');
    } else {
      this.container.classList.remove('hud-ui-hidden');
    }
  }

  warpToZone(zoneId, targetZ) {
    const defaultStarts = [100, 2700, 5300, 7900, 10500, 13100, 15700, 18300, 20900, 23500];
    const finalZ = (targetZ !== undefined && !isNaN(targetZ)) ? targetZ : (defaultStarts[zoneId] || 100);

    const phys = this._physicsRef || (window.game && window.game.physics);
    if (phys) {
      phys.position.z = finalZ;
      phys.speed = 0;
      phys.velocity.set(0, 0, 0);
      phys.respawnOnRoad();

      if (window.game && window.game.zoneManager) window.game.zoneManager.update(phys.position);
      if (window.game && window.game.environment) window.game.environment.update(0.05, phys.position);
      if (window.game && window.game.cameraManager) window.game.cameraManager.resetTracking();
    }
    this.showActionToast('⚡ WARPED TO ZONE', `ARRIVED AT ${ZONES[zoneId] ? ZONES[zoneId].name : 'ZONE ' + zoneId}`, 2500);
  }

  warpToRepairShop(bayZ, bayXOffset = 22.0) {
    const phys = this._physicsRef || (window.game && window.game.physics);
    if (phys && window.game && window.game.splineRoad) {
      const bay = AUTO_REPAIR_SHOPS.find(b => Math.abs(b.z - bayZ) < 50) || AUTO_REPAIR_SHOPS[0];
      const lateral = bay.side === 'right' ? (bay.xOffset || 22.0) : -(bay.xOffset || 22.0);
      const trans = window.game.splineRoad.getRoadTransformAtZ(bayZ, lateral, 0);
      if (trans) {
        if (phys.teleportToCoords) {
          phys.teleportToCoords(trans.pos.x, trans.pos.y + 0.18, trans.pos.z, trans.heading - Math.PI * 0.5);
        } else {
          phys.position.set(trans.pos.x, trans.pos.y + 0.18, trans.pos.z);
          phys.speed = 0;
          phys.velocity.set(0, 0, 0);
          phys.heading = trans.heading - Math.PI * 0.5;
          phys.respawnOnRoad();
        }
      }
    }
    this.showActionToast('🔧 AUTO REPAIR SHOP', 'WARPED TO SERVICE BAY LIFT', 2500);
  }

  warpToMountainSummit() {
    const targetX = 259.02;
    const targetZ = 1126.81;
    const targetHeading = -Math.PI * 0.55; // Facing west toward panoramic deck & binoculars
    const phys = this._physicsRef || (window.game && window.game.physics);
    if (phys) {
      const groundY = phys.getGroundHeightAt ? phys.getGroundHeightAt(targetX, targetZ) : 58.74;
      const targetY = Math.max(groundY, 58.74) + 0.18;
      if (phys.teleportToCoords) {
        phys.teleportToCoords(targetX, targetY, targetZ, targetHeading);
      } else {
        phys.position.set(targetX, targetY, targetZ);
        phys.speed = 0;
        phys.velocity.set(0, 0, 0);
        phys.verticalVelocity = 0;
        phys.heading = targetHeading;
        if (phys.vehicle && phys.vehicle.group) {
          phys.vehicle.group.position.copy(phys.position);
          phys.vehicle.group.rotation.set(0, phys.heading, 0);
        }
        if (window.game && window.game.cameraManager) {
          window.game.cameraManager.resetTracking();
        }
      }
    }
    this.showActionToast('⛰️ MOUNTAIN SUMMIT', 'WARPED TO COUGAR RIDGE SUMMIT OVERLOOK • ELEV 3,500 FT', 3000);
  }

  warpToTrailhead() {
    const phys = this._physicsRef || (window.game && window.game.physics);
    const targetZ = 1010;
    const targetLat = -22;
    let targetX = 14;
    let targetHeading = 0.35;
    if (window.game && window.game.splineRoad) {
      const trans = window.game.splineRoad.getRoadTransformAtZ(targetZ, targetLat, 0);
      if (trans) {
        targetX = trans.pos.x;
        targetHeading = trans.heading + 0.2;
      }
    }
    if (phys) {
      if (phys.teleportToCoords) {
        phys.teleportToCoords(targetX, null, targetZ, targetHeading);
      } else {
        phys.respawnOnRoad(false, targetZ);
      }
    }
    this.showActionToast('🧗 4x4 TRAILHEAD', 'WARPED TO COUGAR RIDGE EXPEDITION ENTRANCE', 2500);
  }

  warpToDownhill() {
    const phys = this._physicsRef || (window.game && window.game.physics);
    const targetX = 244.0;
    const targetZ = 1102.0;
    const targetHeading = -Math.PI * 0.45;
    if (phys) {
      if (phys.teleportToCoords) {
        phys.teleportToCoords(targetX, 56.18, targetZ, targetHeading);
      } else {
        phys.respawnOnRoad(false, targetZ);
      }
    }
    this.showActionToast('⚡ DOWNHILL SPRINT', 'WARPED TO SUMMIT SPRINT LAUNCH GATE', 2500);
  }

  warpToNearestRepairShop() {
    this.callTowTruck();
  }

  callTowTruck() {
    if (window.game && window.game.towTruckManager) {
      window.game.towTruckManager.startTow();
    }
  }

  dismissTowPrompt() {
    gameState.hasDeclinedTowPrompt = true;
    this.showActionToast('🏎️ CONTINUING DRIVE', 'ROADSIDE ASSISTANCE DISMISSED', 2000);
  }

  applyDevCrash(type) {
    if (type === 'repair') {
      if (window.game && window.game.physics) window.game.physics.repairVehicle();
      this.showActionToast('✨ 100% REPAIR', 'VEHICLE FULLY RESTORED', 2000);
      return;
    }
    if (window.game && window.game.physics) {
      const p = window.game.physics;
      if (type === 'front') p.applyDamage(18, 55, 0, 1.0, 0);
      else if (type === 'left') p.applyDamage(18, 50, -0.85, 0.2, 0);
      else if (type === 'rear') p.applyDamage(18, 55, 0, -1.0, 0);
      else if (type === 'rollover') p.applyDamage(65, 70, 0, 0, 0.9);
      this.showActionToast('💥 CRASH INFLICTED', `${type.toUpperCase()} DAMAGE APPLIED`, 2000);
    }
  }

  // 👁️ Coin-Operated Scenic Binoculars Mode
  openBinocularView() {
    if (!gameState.nearbyViewfinder) return;
    const cm = window.game && window.game.cameraManager;
    if (cm) cm.enterBinocularMode(gameState.nearbyViewfinder);
    if (window.game && window.game.sound && window.game.sound.playBinocularCoinDrop) {
      window.game.sound.playBinocularCoinDrop();
    }
    if (this.binocularOverlay) this.binocularOverlay.classList.add('open');
    if (this.binocularPromptPill) this.binocularPromptPill.classList.remove('visible');
    this.container.classList.add('in-binocular-view');
    this.showActionToast('👁️ TOWER OPTICAL SCENIC VIEWFINDER', 'DRAG TO PAN • SCROLL TO ZOOM • [SPACE] TO RECORD', 2800);
  }

  closeBinocularView() {
    const cm = window.game && window.game.cameraManager;
    if (cm) cm.exitBinocularMode();
    if (window.game && window.game.sound && window.game.sound.playBinocularExit) {
      window.game.sound.playBinocularExit();
    }
    if (this.binocularOverlay) this.binocularOverlay.classList.remove('open');
    this.container.classList.remove('in-binocular-view');
  }

  toggleBinocularModal() {
    if (gameState.isBinocularView) {
      this.closeBinocularView();
    } else {
      this.openBinocularView();
    }
  }

  // 📖 Historical Heritage Archive Plaque Modal
  toggleHistoryModal(plaqueId = null) {
    if (gameState.isReadingHistory) {
      this.closeHistoryModal();
    } else {
      const id = plaqueId || (gameState.nearbyHistoryPlaque ? gameState.nearbyHistoryPlaque.id : null);
      if (id) this.openHistoryModal(id);
    }
  }

  openHistoryModal(plaqueId) {
    if (!this.historyModal) return;
    const lore = getHistoricalLore(plaqueId);
    if (!lore) return;

    gameState.isReadingHistory = true;
    gameState.activeHistoryPlaque = lore;

    if (!gameState.discoveredHistoryPlaques.has(plaqueId)) {
      gameState.discoveredHistoryPlaques.add(plaqueId);
      gameState.score += 500;
      this.showActionToast('📖 HISTORIC ARCHIVE DISCOVERED +500 PTS', '★ HERITAGE DISCOVERY ★');
    }

    if (window.game && window.game.sound && window.game.sound.playHistoryPlaqueChime) {
      window.game.sound.playHistoryPlaqueChime();
    }

    if (this.historyZoneTag) this.historyZoneTag.textContent = `ZONE ${lore.zone}: ${(lore.zoneName || '').toUpperCase()}`;
    if (this.historyModalTitle) this.historyModalTitle.textContent = lore.name;
    if (this.historyModalSub) this.historyModalSub.textContent = lore.sub;
    if (this.historyYearEst) this.historyYearEst.textContent = lore.yearEst || '';
    if (this.historyCoords) this.historyCoords.textContent = lore.coords ? `📍 ${lore.coords}` : '';
    if (this.historyElevation) this.historyElevation.textContent = lore.elevation ? `⛰️ ${lore.elevation}` : '';
    if (this.historyLoreText) this.historyLoreText.textContent = lore.historyText;
    if (this.historyFastFactBody) this.historyFastFactBody.textContent = lore.fastFact || '';
    if (this.historyDiscoveryCount) {
      this.historyDiscoveryCount.textContent = `ARCHIVE: ${gameState.discoveredHistoryPlaques.size} / ${TOTAL_HISTORICAL_ARCHIVES} DISCOVERED`;
    }

    this.renderDescriptionPhotos(lore, this.historyDescPhotos);
    this.renderLorePhoto(lore, this.historyPhotoCanvas);

    this.historyModal.classList.add('open');
  }

  renderDescriptionPhotos(lore, container) {
    if (!container) return;
    container.innerHTML = '';
    const photos = (lore && lore.photos && lore.photos.length > 0)
      ? lore.photos
      : getLandmarkPhotos(lore ? lore.id : '');

    if (!photos || photos.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    let activeIndex = 0;

    const header = document.createElement('div');
    header.className = 'history-desc-photos-header';
    header.innerHTML = `
      <span>📷 HISTORICAL LANDMARK PHOTOGRAPHS (${photos.length} ARCHIVE PHOTO${photos.length > 1 ? 'S' : ''})</span>
      <span style="font-size: 10px; color: #94a3b8; font-weight: normal;">AUTHENTIC SURVEY ARCHIVE</span>
    `;

    const card = document.createElement('div');
    card.className = 'history-photo-card';

    const img = document.createElement('img');
    img.className = 'history-place-photo';
    img.src = photos[0].url;
    img.alt = photos[0].alt || lore.name || 'Historical Landmark Photo';
    img.loading = 'lazy';
    img.style.opacity = '0.9';

    img.onload = () => {
      img.style.opacity = '1';
    };
    img.onerror = () => {
      // Fallback: hide gracefully if offline
      card.style.display = 'none';
    };

    const meta = document.createElement('div');
    meta.className = 'history-photo-meta';

    const captionEl = document.createElement('div');
    captionEl.className = 'history-photo-caption';
    captionEl.textContent = photos[0].caption || lore.name;

    const creditEl = document.createElement('div');
    creditEl.className = 'history-photo-credit';
    creditEl.innerHTML = `
      <span class="history-photo-credit-badge">FREE PHOTO</span>
      <span>${photos[0].credit || 'Freely available / Creative Commons'}</span>
    `;

    meta.appendChild(captionEl);
    meta.appendChild(creditEl);

    card.appendChild(img);
    card.appendChild(meta);

    container.appendChild(header);
    container.appendChild(card);

    if (photos.length > 1) {
      const thumbsContainer = document.createElement('div');
      thumbsContainer.className = 'history-photo-thumbs';

      photos.forEach((photo, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `history-photo-thumb ${idx === 0 ? 'active' : ''}`;
        thumb.title = photo.caption || lore.name;
        thumb.innerHTML = `<img src="${photo.url}" alt="${photo.alt || 'Thumbnail'}" />`;

        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          activeIndex = idx;
          img.src = photo.url;
          img.alt = photo.alt || lore.name;
          captionEl.textContent = photo.caption || lore.name;
          creditEl.innerHTML = `
            <span class="history-photo-credit-badge">FREE PHOTO</span>
            <span>${photo.credit || 'Freely available / Creative Commons'}</span>
          `;
          thumbsContainer.querySelectorAll('.history-photo-thumb').forEach((t, i) => {
            t.classList.toggle('active', i === idx);
          });
        });

        thumbsContainer.appendChild(thumb);
      });

      container.appendChild(thumbsContainer);
    }
  }

  closeHistoryModal() {
    if (!this.historyModal) return;
    gameState.isReadingHistory = false;
    gameState.activeHistoryPlaque = null;
    this.historyModal.classList.remove('open');
  }

  renderLorePhoto(lore, canvas) {
    if (!canvas || !lore) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width = 640;
    const h = canvas.height = 320;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    const zone = (lore.zone !== undefined) ? lore.zone : 0;
    const id = lore.id || '';

    // 1. Base Sky & Atmosphere Gradient according to zone and time of day aesthetic
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    if (zone === 0) {
      // Mojave Desert sunset / twilight: deep indigo, burning crimson, warm amber
      skyGrad.addColorStop(0, '#1a102f');
      skyGrad.addColorStop(0.35, '#5c1d3c');
      skyGrad.addColorStop(0.65, '#c85a17');
      skyGrad.addColorStop(0.95, '#f6ad55');
      skyGrad.addColorStop(1, '#ecc94b');
    } else if (zone === 1) {
      // Malibu / Pacific Coast: sunset gold and ocean twilight
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.4, '#1e3a8a');
      skyGrad.addColorStop(0.7, '#d97706');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (zone === 2) {
      // Big Sur: dramatic coastal mist and deep violet sunset
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.4, '#4338ca');
      skyGrad.addColorStop(0.75, '#b45309');
      skyGrad.addColorStop(1, '#fcd34d');
    } else if (zone === 3) {
      // Monterey / Carmel: coastal marine layer, dawn rose & slate
      skyGrad.addColorStop(0, '#111827');
      skyGrad.addColorStop(0.45, '#1e293b');
      skyGrad.addColorStop(0.8, '#475569');
      skyGrad.addColorStop(1, '#94a3b8');
    } else if (zone === 4) {
      // San Francisco / Golden Gate: iconic magenta dusk and bay navy
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.35, '#3b0764');
      skyGrad.addColorStop(0.7, '#9d174d');
      skyGrad.addColorStop(0.92, '#ea580c');
      skyGrad.addColorStop(1, '#fbbf24');
    } else if (zone === 5) {
      // Redwood Empire: misty emerald canopy with filtered amber sunbeams
      skyGrad.addColorStop(0, '#022c22');
      skyGrad.addColorStop(0.45, '#064e3b');
      skyGrad.addColorStop(0.8, '#047857');
      skyGrad.addColorStop(1, '#34d399');
    } else if (zone === 6) {
      // Oregon Coast: stormy moody Pacific slate & twilight violet
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.4, '#1e293b');
      skyGrad.addColorStop(0.75, '#334155');
      skyGrad.addColorStop(1, '#64748b');
    } else if (zone === 7) {
      // Washington Cascades: crisp alpine twilight, alpine glow
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.35, '#1e1b4b');
      skyGrad.addColorStop(0.7, '#312e81');
      skyGrad.addColorStop(1, '#6366f1');
    } else {
      // Olympic / Border: emerald coastal fjord twilight
      skyGrad.addColorStop(0, '#022c22');
      skyGrad.addColorStop(0.5, '#115e59');
      skyGrad.addColorStop(0.85, '#0d9488');
      skyGrad.addColorStop(1, '#5eead4');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Celestial Body (Glowing Sun or Moon)
    const sunX = w * 0.72;
    const sunY = h * 0.38;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 70);
    sunGrad.addColorStop(0, 'rgba(255, 255, 230, 0.95)');
    sunGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.8)');
    sunGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
    sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
    ctx.fill();

    // Sharp sun core
    ctx.fillStyle = '#fffff0';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
    ctx.fill();

    // 3. Distant Mountain Silhouettes (Layer 1 - Distant Ridge)
    ctx.fillStyle = (zone === 0) ? 'rgba(74, 28, 52, 0.6)' :
                    (zone === 5 || zone === 7) ? 'rgba(6, 40, 30, 0.55)' :
                    'rgba(26, 32, 54, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.58);
    for (let x = 0; x <= w; x += 40) {
      const my = h * 0.50 + Math.sin(x * 0.015) * 22 + Math.cos(x * 0.035) * 14;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Distant Mountain Silhouettes (Layer 2 - Mid Ridge)
    ctx.fillStyle = (zone === 0) ? 'rgba(46, 16, 34, 0.85)' :
                    (zone === 5 || zone === 7) ? 'rgba(4, 30, 22, 0.8)' :
                    'rgba(17, 24, 39, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.65);
    for (let x = 0; x <= w; x += 30) {
      const my = h * 0.58 + Math.sin(x * 0.02 + 1.2) * 26 + Math.cos(x * 0.045) * 12;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 4. Ground / Ocean Base Layer
    const groundGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
    if (zone === 0) {
      // Mojave sandy desert floor
      groundGrad.addColorStop(0, '#451a03');
      groundGrad.addColorStop(0.5, '#78350f');
      groundGrad.addColorStop(1, '#291102');
    } else if (zone === 1 || zone === 2 || zone === 3 || zone === 6) {
      // Coastal Pacific ocean and beach rocks
      groundGrad.addColorStop(0, '#0c2238');
      groundGrad.addColorStop(0.4, '#164e63');
      groundGrad.addColorStop(0.7, '#155e75');
      groundGrad.addColorStop(1, '#082f49');
    } else if (zone === 5) {
      // Forest loam floor
      groundGrad.addColorStop(0, '#062817');
      groundGrad.addColorStop(0.6, '#064e3b');
      groundGrad.addColorStop(1, '#021f12');
    } else {
      // Highland alpine terrain
      groundGrad.addColorStop(0, '#0f172a');
      groundGrad.addColorStop(0.6, '#1e293b');
      groundGrad.addColorStop(1, '#0a0f1d');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);

    // Subtle ocean surf / water reflection for coastal zones
    if ((zone >= 1 && zone <= 3) || zone === 6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      for (let i = 0; i < 6; i++) {
        const py = h * (0.72 + i * 0.04);
        ctx.fillRect(w * 0.35 + (i * 25), py, w * 0.45 - (i * 30), 2);
      }
    }

    // 5. Signature Landmark Silhouette & Artwork Features
    if (id.includes('coyote_ridge')) {
      // 🏜️ COYOTE RIDGE SUMMIT: Mountain Ridge, 4x4 Safari Jeep, Wooden Boardwalk Bridge & Binoculars
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.85);
      ctx.lineTo(w * 0.42, h * 0.58);
      ctx.lineTo(w * 0.68, h * 0.62);
      ctx.lineTo(w, h * 0.88);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Boardwalk bridge spanning canyon gap
      ctx.fillStyle = '#78350f';
      ctx.fillRect(w * 0.42, h * 0.59, w * 0.22, 6);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.55);
      ctx.lineTo(w * 0.64, h * 0.55);
      for (let px = w * 0.43; px <= w * 0.63; px += 18) {
        ctx.moveTo(px, h * 0.55);
        ctx.lineTo(px, h * 0.63);
      }
      ctx.stroke();

      // Safari 4x4 Jeep climbing rocky ridge on the left
      const jx = w * 0.24;
      const jy = h * 0.63;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.rect(jx - 24, jy - 14, 48, 12);
      ctx.rect(jx - 18, jy - 28, 28, 14);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(jx - 16, jy - 27, 24, 13);
      // Off-road tires
      ctx.fillStyle = '#05070a';
      ctx.beginPath();
      ctx.arc(jx - 16, jy + 1, 9, 0, Math.PI * 2);
      ctx.arc(jx + 16, jy + 1, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(jx - 16, jy + 1, 3, 0, Math.PI * 2);
      ctx.arc(jx + 16, jy + 1, 3, 0, Math.PI * 2);
      ctx.fill();
      // Headlights beam glow
      const headGrad = ctx.createRadialGradient(jx + 24, jy - 8, 2, jx + 60, jy - 8, 35);
      headGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      headGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(jx + 40, jy - 8, 35, 0, Math.PI * 2);
      ctx.fill();

      // High-power binoculars on summit promontory
      const bx = w * 0.65;
      const by = h * 0.58;
      ctx.fillStyle = '#fde047';
      ctx.fillRect(bx - 2, by - 16, 4, 16);
      ctx.fillRect(bx - 6, by - 22, 16, 7);
      ctx.beginPath();
      ctx.arc(bx - 2, by, 6, 0, Math.PI * 2);
      ctx.fill();

    } else if (id.includes('route66_diner')) {
      // 🍔 ROUTE 66 NEON DINER: Polished Aluminum Diner & Vintage Gas Pumps
      const dx = w * 0.52;
      const dy = h * 0.66;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(dx - 90, dy - 32, 180, 42, [8, 8, 0, 0]);
      } else {
        ctx.rect(dx - 90, dy - 32, 180, 42);
      }
      ctx.fill();
      // Glowing Neon Trim
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dx - 90, dy - 32);
      ctx.lineTo(dx + 90, dy - 32);
      ctx.stroke();
      // Glowing windows
      ctx.fillStyle = '#fef08a';
      for (let wx = dx - 75; wx <= dx + 65; wx += 24) {
        ctx.fillRect(wx, dy - 22, 16, 12);
      }
      // Pylon Sign
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dx - 125, dy - 80, 10, 80);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(dx - 145, dy - 85, 50, 26);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx - 145, dy - 85, 50, 26);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('DINER', dx - 141, dy - 68);
      // Vintage Gas Pumps
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(dx + 110, dy - 18, 12, 28);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(dx + 116, dy - 22, 5, 0, Math.PI * 2);
      ctx.fill();

    } else if (id.includes('bottle_tree')) {
      // 🍾 ELMER'S BOTTLE TREE RANCH
      for (let tx = w * 0.25; tx <= w * 0.85; tx += 65) {
        const th = 60 + Math.sin(tx) * 20;
        const ty = h * 0.72;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx, ty - th);
        ctx.stroke();
        ctx.lineWidth = 2;
        for (let by = ty - 12; by > ty - th; by -= 12) {
          ctx.beginPath();
          ctx.moveTo(tx - 18, by - 4);
          ctx.lineTo(tx, by);
          ctx.lineTo(tx + 18, by - 4);
          ctx.stroke();
          const colors = ['#38bdf8', '#fbbf24', '#22c55e', '#ef4444', '#a855f7'];
          ctx.fillStyle = colors[Math.floor(Math.abs(Math.sin(tx + by) * colors.length))];
          ctx.beginPath();
          ctx.arc(tx - 20, by - 5, 4, 0, Math.PI * 2);
          ctx.arc(tx + 20, by - 5, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(tx - 8, ty - th - 8, 16, 3);
        ctx.fillRect(tx - 1, ty - th - 12, 2, 12);
      }

    } else if (id.includes('wigwam')) {
      // ⛺ WIGWAM VILLAGE MOTEL
      const teepees = [w * 0.22, w * 0.38, w * 0.54, w * 0.70, w * 0.84];
      teepees.forEach((tx, idx) => {
        const ty = h * 0.72;
        const th = 48 + (idx === 2 ? 10 : 0);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(tx, ty - th);
        ctx.lineTo(tx - 22, ty);
        ctx.lineTo(tx + 22, ty);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 18, ty - 8);
        ctx.lineTo(tx, ty - 14);
        ctx.lineTo(tx + 18, ty - 8);
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tx - 4, ty - 14, 8, 14);
      });

    } else if (id.includes('cabazon_dinos')) {
      // 🦕 CABAZON DINOSAURS
      const bx = w * 0.38;
      const by = h * 0.72;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(bx, by - 30, 60, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - 40, by - 35);
      ctx.quadraticCurveTo(bx - 80, by - 80, bx - 100, by - 75);
      ctx.arc(bx - 100, by - 75, 9, 0, Math.PI * 2);
      ctx.lineTo(bx - 30, by - 25);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx + 40, by - 30);
      ctx.quadraticCurveTo(bx + 110, by - 15, bx + 130, by - 10);
      ctx.lineTo(bx + 40, by - 15);
      ctx.fill();
      ctx.fillRect(bx - 35, by - 15, 14, 25);
      ctx.fillRect(bx - 15, by - 15, 14, 25);
      ctx.fillRect(bx + 15, by - 15, 14, 25);
      ctx.fillRect(bx + 35, by - 15, 14, 25);

      const rx = w * 0.72;
      ctx.beginPath();
      ctx.ellipse(rx, by - 35, 25, 38, -0.2, 0, Math.PI * 2);
      ctx.rect(rx - 15, by - 65, 32, 20);
      ctx.fillRect(rx - 8, by - 10, 16, 20);
      ctx.fill();

    } else if (id.includes('bixby_bridge')) {
      // 🌉 BIXBY CREEK BRIDGE
      const bx = w * 0.50;
      const by = h * 0.62;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(w * 0.15, by - 8, w * 0.70, 8);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(bx, by + 45, 65, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2;
      for (let x = bx - 55; x <= bx + 55; x += 15) {
        const archY = by + 45 - Math.sqrt(Math.max(0, 65 * 65 - (x - bx) * (x - bx)));
        ctx.beginPath();
        ctx.moveTo(x, by);
        ctx.lineTo(x, archY);
        ctx.stroke();
      }
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, by - 25);
      ctx.lineTo(w * 0.20, by);
      ctx.lineTo(w * 0.24, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w, by - 25);
      ctx.lineTo(w * 0.80, by);
      ctx.lineTo(w * 0.76, h);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

    } else if (id.includes('golden_gate')) {
      // 🌉 GOLDEN GATE BRIDGE
      const t1 = w * 0.35;
      const t2 = w * 0.68;
      const by = h * 0.64;
      ctx.fillStyle = '#c2410c';
      [t1, t2].forEach(tx => {
        ctx.fillRect(tx - 6, by - 110, 12, 110);
        for (let strY = by - 95; strY <= by - 20; strY += 24) {
          ctx.fillRect(tx - 12, strY, 24, 4);
        }
      });
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(0, by - 12, w, 8);
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, by - 12);
      ctx.quadraticCurveTo(t1 * 0.5, by - 60, t1, by - 110);
      ctx.quadraticCurveTo((t1 + t2) * 0.5, by - 25, t2, by - 110);
      ctx.quadraticCurveTo(t2 + (w - t2) * 0.5, by - 60, w, by - 12);
      ctx.stroke();

    } else if (id.includes('redwood') || id.includes('chandelier')) {
      // 🌲 CHANDELIER DRIVE-THRU TREE / REDWOODS
      const rx = w * 0.50;
      const ry = h * 0.80;
      ctx.fillStyle = '#29180d';
      ctx.beginPath();
      ctx.moveTo(rx - 70, ry);
      ctx.lineTo(rx - 45, 0);
      ctx.lineTo(rx + 45, 0);
      ctx.lineTo(rx + 70, ry);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      for (let bx = rx - 35; bx <= rx + 35; bx += 18) {
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx + (bx > rx ? 10 : -10), ry);
        ctx.stroke();
      }
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath();
      ctx.arc(rx, ry - 14, 26, Math.PI, 0);
      ctx.lineTo(rx + 26, ry + 10);
      ctx.lineTo(rx - 26, ry + 10);
      ctx.closePath();
      ctx.fill();
      const rayGrad = ctx.createLinearGradient(rx, ry - 14, rx, ry + 40);
      rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
      rayGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rx - 20, ry);
      ctx.lineTo(rx - 45, ry + 40);
      ctx.lineTo(rx + 45, ry + 40);
      ctx.lineTo(rx + 20, ry);
      ctx.closePath();
      ctx.fill();

    } else if (id.includes('haystack_rock')) {
      // 🪨 CANNON BEACH HAYSTACK ROCK
      const hx = w * 0.46;
      const hy = h * 0.72;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(hx - 80, hy);
      ctx.quadraticCurveTo(hx - 60, hy - 85, hx, hy - 95);
      ctx.quadraticCurveTo(hx + 60, hy - 90, hx + 85, hy);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx + 100, hy);
      ctx.lineTo(hx + 115, hy - 45);
      ctx.lineTo(hx + 130, hy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(hx - 90, hy - 3, 230, 4);

    } else if (id.includes('pier') || id.includes('pacific_park')) {
      // 🎡 SANTA MONICA PIER / PACIFIC PARK
      const px = w * 0.65;
      const py = h * 0.56;
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, py + 12, w, 10);
      for (let pl = 20; pl < w; pl += 28) {
        ctx.fillRect(pl, py + 22, 6, 40);
      }
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py - 30, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(px, py - 30);
        ctx.lineTo(px + Math.cos(a) * 36, py - 30 + Math.sin(a) * 36);
        ctx.stroke();
      }
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, py + 12);
      ctx.quadraticCurveTo(w * 0.28, py - 40, w * 0.38, py + 12);
      ctx.quadraticCurveTo(w * 0.44, py - 20, w * 0.50, py + 12);
      ctx.stroke();

    } else if (id.includes('light')) {
      // 🚨 HISTORIC LIGHTHOUSE
      const lx = w * 0.68;
      const ly = h * 0.65;
      const beamGrad = ctx.createLinearGradient(lx, ly - 70, 0, ly - 40);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(lx, ly - 70);
      ctx.lineTo(0, ly - 95);
      ctx.lineTo(0, ly + 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(lx - 16, ly);
      ctx.lineTo(lx - 10, ly - 65);
      ctx.lineTo(lx + 10, ly - 65);
      ctx.lineTo(lx + 16, ly);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(lx - 12, ly - 78, 24, 13);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lx - 8, ly - 75, 16, 8);
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(lx, ly - 88);
      ctx.lineTo(lx - 14, ly - 78);
      ctx.lineTo(lx + 14, ly - 78);
      ctx.closePath();
      ctx.fill();

    } else {
      // 🏞️ DEFAULT PANORAMIC HIGHWAY & REGIONAL LANDSCAPE
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.66);
      ctx.lineTo(w * 0.54, h * 0.66);
      ctx.lineTo(w * 0.78, h);
      ctx.lineTo(w * 0.18, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(w * 0.50, h * 0.66);
      ctx.lineTo(w * 0.48, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = (zone === 0) ? '#1c1917' : '#052e16';
      if (zone === 0) {
        for (let sx = w * 0.08; sx <= w * 0.88; sx += 90) {
          const sy = h * 0.69;
          ctx.fillRect(sx - 3, sy - 34, 6, 34);
          ctx.fillRect(sx - 12, sy - 24, 9, 4);
          ctx.fillRect(sx - 12, sy - 34, 4, 14);
          ctx.fillRect(sx + 3, sy - 18, 9, 4);
          ctx.fillRect(sx + 8, sy - 28, 4, 14);
        }
      } else if (zone === 1 || zone === 2) {
        for (let px = w * 0.12; px <= w * 0.88; px += 110) {
          const py = h * 0.70;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.quadraticCurveTo(px + 8, py - 35, px + 5, py - 60);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.fillStyle = '#041f10';
          for (let fa = 0; fa < Math.PI * 2; fa += Math.PI / 4) {
            ctx.beginPath();
            ctx.ellipse(px + 5 + Math.cos(fa) * 16, py - 60 + Math.sin(fa) * 7, 16, 5, fa, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        for (let fx = w * 0.08; fx <= w * 0.92; fx += 65) {
          const fy = h * 0.70;
          const fth = 40 + Math.abs(Math.sin(fx)) * 30;
          ctx.beginPath();
          ctx.moveTo(fx, fy - fth);
          ctx.lineTo(fx - 14, fy);
          ctx.lineTo(fx + 14, fy);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // 6. Vintage Film Aesthetic: Sepia / Warm Golden Tone Wash
    ctx.fillStyle = 'rgba(245, 158, 11, 0.09)';
    ctx.fillRect(0, 0, w, h);

    // 7. 35mm Vignette (Darkened film corners)
    const vigGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.28, w * 0.5, h * 0.5, w * 0.62);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(0.7, 'rgba(0,0,0,0.3)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // 8. Authentic Vintage Postcard Border & Survey Stamp
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, w - 28, h - 28);

    ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`★ SCENIC HIGHWAY HERITAGE • ZONE ${zone} • ${lore.yearEst || 'SURVEY ARCHIVE'}`, 24, 28);

    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.font = '9px monospace';
    const locTag = `${lore.milepost || 'MP --'} | ${lore.coords || 'CALIFORNIA COAST'}`;
    ctx.fillText(locTag, 24, h - 20);

    ctx.restore();

    if (this.historyPhotoBadge) {
      this.historyPhotoBadge.textContent = `📷 ${lore.name.toUpperCase()} • ${lore.era || 'VINTAGE 35MM ARCHIVE'}`;
    }

    // Preload authentic photograph to paint onto canvas once loaded
    const photos = (lore && lore.photos && lore.photos.length > 0)
      ? lore.photos
      : getLandmarkPhotos(lore ? lore.id : '');

    if (photos && photos.length > 0 && photos[0].url) {
      const heroImg = new Image();
      heroImg.crossOrigin = 'anonymous';
      const currentLoreId = lore.id;
      heroImg.onload = () => {
        if (!gameState.activeHistoryPlaque || gameState.activeHistoryPlaque.id !== currentLoreId) return;
        ctx.save();
        const aspect = heroImg.naturalWidth / heroImg.naturalHeight;
        let dw = w;
        let dh = w / aspect;
        if (dh < h) {
          dh = h;
          dw = h * aspect;
        }
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(heroImg, dx, dy, dw, dh);

        // Vintage film aesthetic wash
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.fillRect(0, 0, w, h);

        // 35mm film vignette
        const vigGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.28, w * 0.5, h * 0.5, w * 0.62);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(0.7, 'rgba(0,0,0,0.3)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, w, h);

        // Authentic vintage postcard border & survey stamp
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(10, 10, w - 20, h - 20);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(14, 14, w - 28, h - 28);

        ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`★ SCENIC HIGHWAY HERITAGE • ZONE ${zone} • ${lore.yearEst || 'SURVEY ARCHIVE'}`, 24, 28);

        ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
        ctx.font = '9px monospace';
        const locTag = `${lore.milepost || 'MP --'} | ${lore.coords || 'PACIFIC COAST'}`;
        ctx.fillText(locTag, 24, h - 20);

        ctx.restore();
      };
      heroImg.src = photos[0].url;
    }
  }

  showResumePrompt(saved, zoneName, onContinue, onReset) {
    if (!this.resumeBackdrop) return;
    this.isResumePromptActive = true;
    this._resumeOnContinue = onContinue;
    this._resumeOnReset = onReset;

    const elZone = this.container.querySelector('#resume-card-zone-text');
    const elCoord = this.container.querySelector('#resume-card-coord-text');
    const elScore = this.container.querySelector('#resume-card-score');
    const elShields = this.container.querySelector('#resume-card-shields');
    const elClues = this.container.querySelector('#resume-card-clues');
    const elIntegrity = this.container.querySelector('#resume-card-integrity');

    if (elZone) elZone.textContent = `${(zoneName || 'HIGHWAY 1').toUpperCase()}`;
    if (elCoord) elCoord.textContent = `Highway Position: Z = ${Math.round(saved.playerZ || 0)}m`;
    if (elScore) elScore.textContent = `${(saved.score || 0).toLocaleString()} PTS`;
    if (elShields) elShields.textContent = `${saved.route66ShieldsCollected || 0} / ${saved.totalRoute66Shields || 5}`;
    if (elClues) {
      const cluesCount = saved.mysteryMission?.cluesFound || 0;
      elClues.textContent = `${cluesCount} / 9`;
    }
    if (elIntegrity) elIntegrity.textContent = `${Math.round(saved.carIntegrity || 100)}%`;

    this.resumeBackdrop.classList.add('open');
  }

  hideResumePrompt() {
    if (this.resumeBackdrop) {
      this.resumeBackdrop.classList.remove('open');
    }
    this.isResumePromptActive = false;
  }

  openPauseMenu() {
    if (!this.pauseBackdrop) return;
    // Don't open if tablet, cutscene, or resume prompt is active
    if (this.isResumePromptActive || gameState.isCutsceneActive || gameState.isTabletOpen) return;

    this.isPauseMenuOpen = true;
    gameState.isPaused = true;

    const elZone = this.container.querySelector('#pause-card-zone-text');
    if (elZone) {
      const zIdx = gameState.currentZoneIndex || 0;
      const zName = (typeof window !== 'undefined' && window.game && window.game.ZONES && window.game.ZONES[zIdx])
        ? window.game.ZONES[zIdx].name
        : `ZONE ${zIdx}`;
      elZone.textContent = `${zName} • Z = ${Math.round(gameState.playerZ || 0)}m`;
    }

    this.pauseBackdrop.classList.add('open');
  }

  closePauseMenu() {
    if (!this.pauseBackdrop) return;
    this.isPauseMenuOpen = false;
    gameState.isPaused = false;
    this.pauseBackdrop.classList.remove('open');
  }

  togglePauseMenu() {
    if (this.isPauseMenuOpen) {
      this.closePauseMenu();
    } else {
      this.openPauseMenu();
    }
  }

  setupStartGate(onStartCallback) {
    this.onStartCallback = onStartCallback;
    const triggerStart = () => {
      if (this._hasStarted) return;
      if (this.isResumePromptActive) return;
      this._hasStarted = true;
      if (this.startScreen) this.startScreen.classList.add('gate-hidden');
      if (this.onStartCallback) this.onStartCallback();
    };

    ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => {
        if (!this._hasStarted) triggerStart();
      }, { passive: true });
    });
  }

  showActionToast(badge, title, durationMs = 2800) {
    if (!this.actionToast) return;
    if (this.actionToastBadge) this.actionToastBadge.textContent = badge;
    if (this.actionToastTitle) this.actionToastTitle.textContent = title;
    this.actionToast.classList.add('show');
    clearTimeout(this._actionToastTimer);
    this._actionToastTimer = setTimeout(() => {
      if (this.actionToast) this.actionToast.classList.remove('show');
    }, durationMs);
  }

  drawRadarMap(physics, splineRoad) {
    if (!this.tabRadarCtx || !physics || !splineRoad) return;

    const ctx = this.tabRadarCtx;
    const w = this.tabRadarCanvas.width;
    const h = this.tabRadarCanvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const radius = w * 0.48;
    const mapScale = 0.55;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#0b111e';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-physics.heading);

    const px = physics.position.x;
    const pz = physics.position.z;

    // Ocean boundary
    ctx.fillStyle = 'rgba(14, 116, 144, 0.4)';
    ctx.fillRect(-240 - px * mapScale, -240, (-28 - px) * mapScale + 240, 480);

    // Highway line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10 * mapScale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const segRange = 220;
    const startZ = Math.max(0, pz - segRange);
    const endZ = Math.min((splineRoad && splineRoad.totalLength) ? splineRoad.totalLength : 62000, pz + segRange);
    for (let z = startZ; z <= endZ; z += 14) {
      const roadPt = splineRoad.getRoadInfo(0, z).roadPoint;
      const rx = (roadPt.x - px) * mapScale;
      const ry = -(roadPt.z - pz) * mapScale;
      if (z === startZ) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    // Centerline
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.2 * mapScale;
    ctx.beginPath();
    for (let z = startZ; z <= endZ; z += 14) {
      const roadPt = splineRoad.getRoadInfo(0, z).roadPoint;
      const rx = (roadPt.x - px) * mapScale;
      const ry = -(roadPt.z - pz) * mapScale;
      if (z === startZ) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    // Turnouts & Repair Shops on Map
    SCENIC_PARKING_LOTS.forEach(lot => {
      if (Math.abs(lot.z - pz) < segRange) {
        const trans = splineRoad.getRoadTransformAtZ(lot.z, lot.xOffset, 0);
        const lx = (trans.pos.x - px) * mapScale;
        const ly = -(trans.pos.z - pz) * mapScale;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();

    // Player Arrow
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx - 7, cy + 8);
    ctx.lineTo(cx, cy + 5);
    ctx.lineTo(cx + 7, cy + 8);
    ctx.closePath();
    ctx.fill();

    // Radar Outer Ring
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawFPSGraph() {
    if (!this.fpsGraphCtx || !this._fpsGraphSamples || this._fpsGraphSamples.length < 2) return;
    const ctx = this.fpsGraphCtx;
    const w = this.fpsGraphCanvas.width;
    const h = this.fpsGraphCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const targetFps = (typeof gameState.targetFps === 'number' && gameState.targetFps > 0)
      ? gameState.targetFps
      : (gameState.targetFps === 'uncapped' ? 144 : 120);
    const targetMs = 1000 / targetFps;
    const maxMs = 35.0;
    const yTarget = Math.max(2, Math.min(h - 2, h - (targetMs / maxMs) * h));

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yTarget);
    ctx.lineTo(w, yTarget);
    ctx.stroke();
    ctx.setLineDash([]);

    const samples = this._fpsGraphSamples;
    const step = w / Math.max(1, samples.length - 1);
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const ms = Math.min(maxMs, samples[i]);
      const x = i * step;
      const y = h - (ms / maxMs) * (h - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  updateFPS(dt, rawDt = dt, renderMetrics = null) {
    const frameDt = Math.max(0.0005, rawDt || dt);
    const instantaneousFps = 1.0 / frameDt;
    const frameMs = frameDt * 1000;

    this._fpsHistory = this._fpsHistory || [];
    this._fpsHistory.push(instantaneousFps);
    if (this._fpsHistory.length > 120) this._fpsHistory.shift();

    this._fpsGraphSamples = this._fpsGraphSamples || [];
    this._fpsGraphSamples.push(frameMs);
    if (this._fpsGraphSamples.length > 120) this._fpsGraphSamples.shift();

    this._fpsTimeAcc = (this._fpsTimeAcc || 0) + dt;
    if (this._fpsTimeAcc >= 0.10) {
      const history = this._fpsHistory;
      const avgFps = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
      const minFps = Math.round(Math.min(...history));
      const maxFps = Math.round(Math.max(...history));
      const low1Pct = Math.round(minFps);
      const currentFps = Math.round(instantaneousFps);

      gameState.fps = avgFps;
      gameState.frameMs = parseFloat(frameMs.toFixed(1));

      const targetFps = (typeof gameState.targetFps === 'number' && gameState.targetFps > 0)
        ? gameState.targetFps
        : (gameState.targetFps === 'uncapped' ? 120 : 120);
      const greenThreshold = targetFps * 0.88;
      const yellowThreshold = targetFps * 0.58;

      if (this.perfCurrentFps) {
        this.perfCurrentFps.textContent = `${currentFps} FPS`;
        this.perfCurrentFps.className = `perf-kpi-val ${avgFps >= greenThreshold ? 'green' : (avgFps >= yellowThreshold ? 'yellow' : 'red')}`;
      }
      if (this.perfFrameMs) this.perfFrameMs.textContent = `${frameMs.toFixed(1)} ms/frame`;
      if (this.perfAvgFps) this.perfAvgFps.textContent = `${avgFps} FPS`;
      if (this.perfFpsRange) this.perfFpsRange.textContent = `Min: ${minFps} • Max: ${maxFps}`;
      if (this.perfLow1Fps) this.perfLow1Fps.textContent = `${low1Pct} FPS`;

      // Update real-time on-screen HUD FPS Tracker badge
      if (this.hudLiveFpsVal) this.hudLiveFpsVal.textContent = currentFps;
      if (this.hudLiveMsVal) this.hudLiveMsVal.textContent = `${frameMs.toFixed(1)}ms`;
      if (this.hudLiveFpsBadge) {
        const liveCls = currentFps >= 50 ? 'fps-green' : (currentFps >= 30 ? 'fps-yellow' : 'fps-red');
        this.hudLiveFpsBadge.classList.remove('fps-green', 'fps-yellow', 'fps-red');
        this.hudLiveFpsBadge.classList.add(liveCls);
      }

      if (renderMetrics) {
        if (this.perfDprVal) this.perfDprVal.textContent = `${renderMetrics.dpr}x`;
        if (this.perfResolutionVal) {
          const w = Math.round(window.innerWidth * (renderMetrics.dpr || 1));
          const h = Math.round(window.innerHeight * (renderMetrics.dpr || 1));
          this.perfResolutionVal.textContent = `${w} × ${h}`;
        }
      }

      this.updateTargetText();

      if (gameState.isTabletOpen && gameState.activeTabletApp === 'perf') {
        this.drawFPSGraph();
      }
      this._fpsTimeAcc = 0;
    }
  }

  updateTabletLiveTelemetry(physics, splineRoad) {
    const zone = ZONES[gameState.currentZoneIndex] || ZONES[0];
    const distKm = (gameState.distanceMeters / 1000).toFixed(1);
    const totalHwyLen = (splineRoad && splineRoad.totalLength) ? splineRoad.totalLength : 62000;
    const progressPct = Math.min(100, Math.max(0, (gameState.distanceMeters / totalHwyLen) * 100));

    if (this.tabletClock) {
      const d = new Date();
      this.tabletClock.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (this.tabletStatusZone) {
      this.tabletStatusZone.textContent = `ZONE ${gameState.currentZoneIndex}: ${zone.name}`;
    }

    if (this.tabMilestoneZoneNum) this.tabMilestoneZoneNum.textContent = `ZONE ${gameState.currentZoneIndex}`;
    if (this.tabMilestoneZoneName) this.tabMilestoneZoneName.textContent = zone.name;
    if (this.tabMilestoneZoneSub) this.tabMilestoneZoneSub.textContent = zone.sub;
    if (this.tabMilestoneTemp) this.tabMilestoneTemp.textContent = zone.temperature ? `☀️ ${zone.temperature}` : '☀️ 104°F';
    if (this.tabMilestoneDist) this.tabMilestoneDist.textContent = `${distKm} km / ${(totalHwyLen / 1000).toFixed(1)} km`;
    if (this.tabMilestonePct) this.tabMilestonePct.textContent = `${Math.round(progressPct)}%`;
    if (this.tabProgressFill) this.tabProgressFill.style.width = `${progressPct}%`;
    if (this.tabMilestoneStatus) this.tabMilestoneStatus.textContent = `ZONE ${gameState.currentZoneIndex} ACTIVE`;

    // Update GPS Telemetry text & Radar Map
    if (physics) {
      const deg = Math.round(((physics.heading * 180 / Math.PI) % 360 + 360) % 360);
      let dir = 'NORTH';
      if (deg >= 45 && deg < 135) dir = 'EAST';
      else if (deg >= 135 && deg < 225) dir = 'SOUTH';
      else if (deg >= 225 && deg < 315) dir = 'WEST';

      if (this.tabGpsHeading) this.tabGpsHeading.textContent = `${deg}° ${dir}`;
      if (this.tabGpsSurface) this.tabGpsSurface.textContent = (gameState.surface || 'ASPHALT').toUpperCase();
      if (this.tabGpsCoords) this.tabGpsCoords.textContent = `X: ${Math.round(physics.position.x)}m • Z: ${Math.round(physics.position.z)}m`;
    }

    if (this.tabCheckpointItems) {
      this.tabCheckpointItems.forEach(item => {
        const zId = parseInt(item.getAttribute('data-chk-zone'), 10);
        const badge = item.querySelector('.checkpoint-status-badge');
        item.classList.remove('completed', 'current');
        if (zId < gameState.currentZoneIndex) {
          item.classList.add('completed');
          if (badge) {
            badge.className = 'checkpoint-status-badge badge-completed';
            badge.textContent = 'COMPLETED';
          }
        } else if (zId === gameState.currentZoneIndex) {
          item.classList.add('current');
          if (badge) {
            badge.className = 'checkpoint-status-badge badge-current';
            badge.textContent = 'CURRENT LOCATION';
          }
        } else {
          if (badge) {
            badge.className = 'checkpoint-status-badge badge-ahead';
            badge.textContent = 'AHEAD';
          }
        }
      });
    }

    // Update Diagnostics
    const integrity = Math.round(gameState.carIntegrity !== undefined ? gameState.carIntegrity : 100);
    if (this.tabDiagIntegrity) {
      this.tabDiagIntegrity.textContent = `${integrity}% ${integrity < 20 ? 'CRITICAL' : (integrity < 50 ? 'DAMAGED' : 'OK')}`;
      this.tabDiagIntegrity.style.color = integrity < 20 ? '#ef4444' : (integrity < 50 ? '#facc15' : '#38bdf8');
    }
    if (this.tabDiagFront) {
      this.tabDiagFront.textContent = integrity < 50 ? 'DENTED' : 'OK';
      this.tabDiagFront.style.color = integrity < 50 ? '#facc15' : '#22c55e';
    }
    if (this.tabDiagEngine) {
      this.tabDiagEngine.textContent = `${Math.max(45, integrity)}% POWER`;
      this.tabDiagEngine.style.color = integrity < 30 ? '#ef4444' : '#22c55e';
    }
    if (this.tabDiagSurface) {
      this.tabDiagSurface.textContent = (gameState.surface || 'ASPHALT').toUpperCase();
    }

    // Case Files Tag & Live View Sync
    const caseTag = this.container.querySelector('#tab-app-tag-casefiles');
    if (caseTag && gameState.mysteryMission) {
      const m = gameState.mysteryMission;
      if (m.state === 'solved') {
        caseTag.textContent = '★ Solved (+5,000 PTS)';
        caseTag.style.color = '#10b981';
      } else if (m.witnessedMurder) {
        caseTag.textContent = `Active Case: Clues (${m.cluesFound}/2)`;
        caseTag.style.color = '#f59e0b';
      } else {
        caseTag.textContent = 'Mob hit investigation & evidence';
        caseTag.style.color = '#94a3b8';
      }
    }
    if (gameState.activeTabletApp === 'casefiles' && gameState.mysteryMission) {
      const m = gameState.mysteryMission;
      const caseKey = `${m.state}_${m.cluesFound}_${m.reportedToPolice}`;
      if (this._cacheCaseKey !== caseKey) {
        this._cacheCaseKey = caseKey;
        this.populateCaseFiles();
      }
    }

    // Draw Tablet GPS Radar Map when Milestones app is open
    if (gameState.activeTabletApp === 'milestones' && physics && splineRoad) {
      this.drawRadarMap(physics, splineRoad);
    }

    if (gameState.activeTabletApp === 'savegame') {
      this.updateSaveGameView();
    }

    if (gameState.activeTabletApp === 'youtube') {
      this.dockYouTubeInTablet();
    }
  }

  update(physics, splineRoad, dt = 0.016, rawDt = dt, renderMetrics = null) {
    this._physicsRef = physics;
    this.updateFPS(dt, rawDt, renderMetrics);

    // YouTube In-Car Highway Stereo HUD Widget (Dirty-checked to preserve 60 FPS)
    if (gameState.youtubeApp) {
      const ytKey = `${gameState.youtubeApp.isPlaying}_${gameState.youtubeApp.currentTitle}_${gameState.youtubeApp.isMuted}_${gameState.isTabletOpen}_${gameState.youtubeApp.isStereoWidgetVisible}`;
      if (this._cacheYtKey !== ytKey) {
        this._cacheYtKey = ytKey;
        this.updateCarStereoWidget();
      }
    }

    // Speedometer Display (Dirty-checked to avoid redundant DOM writes)
    const spd = gameState.speedMph || 0;
    if (this.speedEl && spd !== this._cacheSpeedMph) {
      this._cacheSpeedMph = spd;
      this.speedEl.textContent = String(spd).padStart(2, '0');
    }

    // Nitro
    const nPct = Math.round(gameState.nitro);
    if (nPct !== this._cacheNitroPct) {
      this._cacheNitroPct = nPct;
      if (this.nitroPct) this.nitroPct.textContent = `${nPct}%`;
      if (this.nitroBar) this.nitroBar.style.width = `${nPct}%`;
    }

    // Vehicle Structural Integrity
    const integrity = Math.round(gameState.carIntegrity !== undefined ? gameState.carIntegrity : 100);
    if (integrity !== this._cacheIntegrity) {
      this._cacheIntegrity = integrity;
      if (this.integrityBar && this.integrityVal) {
        this.integrityBar.style.width = `${integrity}%`;
        this.integrityVal.textContent = `${integrity}%`;
        this.integrityVal.style.color = integrity < 20 ? '#ef4444' : (integrity < 50 ? '#facc15' : '#38bdf8');
      }
    }

    // 🏔️ Off-Road Telemetry & Inclinometer Cluster Update
    if (this.offroadCluster) {
      const rawMode = gameState.driveMode || 'HIGH';
      const mode = (rawMode === '2H' || rawMode === '4H') ? 'HIGH' : (rawMode === '4L' ? 'LOW' : rawMode);
      const isOnTrail = Boolean(gameState.isOnTrail);
      
      // Update Drive Mode badge & pill button
      const rawRec = gameState.recommendedDriveMode || 'HIGH';
      const recMode = (rawRec === '2H' || rawRec === '4H') ? 'HIGH' : (rawRec === '4L' ? 'LOW' : rawRec);
      const isWrong = Boolean(gameState.isWrongGear || gameState.isWrongDrivetrain);

      if (mode !== this._cacheDriveMode || recMode !== this._cacheRecMode || isWrong !== this._cacheWrongDrivetrain) {
        this._cacheDriveMode = mode;
        this._cacheRecMode = recMode;
        this._cacheWrongDrivetrain = isWrong;

        if (this.btnToggle4x4) this.btnToggle4x4.textContent = `[ ${mode} ]`;
        if (this.telemetryBtnLabel) this.telemetryBtnLabel.textContent = `GEAR [${mode}]`;
        if (this.drivetrainModeVal) {
          this.drivetrainModeVal.textContent = mode === 'LOW' ? 'LOW GEAR (ROCK CRAWL)' : (mode === 'MID' ? 'MID GEAR (LOCKED 4X4)' : 'HIGH GEAR (HIGHWAY)');
        }
        if (this.drivetrainLockIndicator) {
          this.drivetrainLockIndicator.textContent = gameState.diffLocked ? '🔒 DUAL LOCKERS' : 'OPEN DIFF';
          this.drivetrainLockIndicator.style.color = gameState.diffLocked ? '#f59e0b' : '#94a3b8';
        }
        const shifterKnob = document.getElementById('touch-shifter-knob');
        if (shifterKnob) {
          shifterKnob.setAttribute('data-mode', mode);
          shifterKnob.classList.toggle('wrong-gear-alert', isWrong);
          const modeLabel = shifterKnob.querySelector('#shifter-mode-text');
          if (modeLabel) modeLabel.textContent = (mode === 'HIGH' ? '3' : (mode === 'MID' ? '2' : '1'));
          const posList = shifterKnob.querySelectorAll('.pattern-pos');
          posList.forEach(p => {
            const pMode = p.getAttribute('data-pos');
            p.classList.toggle('active', pMode === mode);
            p.classList.toggle('recommended', isWrong && pMode === recMode);
          });
          const lever = shifterKnob.querySelector('#shifter-lever-assembly');
          if (lever && !lever.classList.contains('dragging')) {
            const topPx = (mode === 'LOW') ? 50 : ((mode === 'MID') ? 27 : 4);
            lever.style.top = `${topPx}px`;
          }
          const recBadge = shifterKnob.querySelector('#shifter-rec-text');
          if (recBadge) {
            if (isWrong) {
              recBadge.style.display = 'block';
              const recNum = recMode === 'HIGH' ? '3 [HIGH]' : (recMode === 'MID' ? '2 [MID]' : '1 [LOW]');
              recBadge.textContent = `REC: ${recNum}`;
            } else {
              recBadge.style.display = 'none';
            }
          }
        }
      }

      // Trail Stage indicator
      const isOnDownhill = Boolean(gameState.isOnDownhillRoute);
      const stage = gameState.currentTrailStage || (isOnDownhill ? '⚡ DOWNHILL SPRINT' : (isOnTrail ? 'COUGAR RIDGE 4x4' : 'HIGHWAY 1'));
      if (stage !== this._cacheTrailStage) {
        this._cacheTrailStage = stage;
        if (this.trailStageBadge) this.trailStageBadge.textContent = stage;
        this.offroadCluster.classList.toggle('on-trail', isOnTrail || isOnDownhill);
      }

      // Pitch & Roll Telemetry
      const rollDeg = gameState.rollDeg || 0;
      const pitchDeg = gameState.pitchDeg || 0;
      const altM = gameState.altitudeMeters || 0;
      const gradePct = gameState.trailGradePct || 0;

      if (this.inclinometerRollDisc) {
        this.inclinometerRollDisc.style.transform = `rotate(${-rollDeg}deg)`;
      }
      if (this.inclinometerRollVal) {
        this.inclinometerRollVal.textContent = `${rollDeg >= 0 ? '+' : ''}${rollDeg.toFixed(1)}°`;
        this.inclinometerRollVal.style.color = Math.abs(rollDeg) > 30 ? '#ef4444' : (Math.abs(rollDeg) > 18 ? '#facc15' : '#f8fafc');
      }

      if (this.inclinometerPitchBubble) {
        const clampedPitch = Math.max(-25, Math.min(25, pitchDeg));
        const bubbleOffsetY = -(clampedPitch / 25) * 18; // px offset
        this.inclinometerPitchBubble.style.transform = `translate(-50%, calc(-50% + ${bubbleOffsetY}px))`;
      }
      if (this.inclinometerPitchVal) {
        this.inclinometerPitchVal.textContent = `${pitchDeg >= 0 ? '+' : ''}${pitchDeg.toFixed(1)}°`;
        this.inclinometerPitchVal.style.color = Math.abs(pitchDeg) > 25 ? '#facc15' : '#f8fafc';
      }

      if (this.altimeterVal) {
        const feet = Math.round(altM * 3.28084);
        this.altimeterVal.textContent = `${feet.toLocaleString()} FT`;
      }
      if (this.gradeVal) {
        this.gradeVal.textContent = `${gradePct >= 0 ? '+' : ''}${gradePct}%`;
      }

      // Rollover hazard warning banner
      if (this.rolloverHazardBanner) {
        const isHazard = Math.abs(rollDeg) > 30;
        this.rolloverHazardBanner.style.display = isHazard ? 'block' : 'none';
      }
    }

    // ⚠️ Wrong Gear Alert Banner
    if (this.gearAlertEl) {
      const isWrong = Boolean(gameState.isWrongGear);
      if (isWrong) {
        this.gearAlertEl.classList.add('visible');
        if (this.gearAlertTitle && gameState.wrongGearTitle) {
          this.gearAlertTitle.textContent = gameState.wrongGearTitle;
        }
        if (this.gearAlertSub && gameState.wrongGearSubtitle) {
          this.gearAlertSub.textContent = gameState.wrongGearSubtitle;
        }
        if (this.gearAlertKey && gameState.wrongGearAction) {
          this.gearAlertKey.textContent = gameState.wrongGearAction;
        }
      } else {
        this.gearAlertEl.classList.remove('visible');
      }
    }

    // Prominent Scenic Highway Turnout Alert & Discovery Banner (Throttled to every ~100ms)
    const now = performance.now();
    if ((!this._turnoutCheckTime || (now - this._turnoutCheckTime >= 100)) && this.scenicWaypoint && splineRoad) {
      this._turnoutCheckTime = now;
      const pZ = (physics && physics.position) ? physics.position.z : (gameState.distanceMeters || 0);
      const pX = (physics && physics.position) ? physics.position.x : 0;
      let closestLot = null;
      let closestDist = Infinity;
      let isInCurrentLot = false;

      // Highway advance alert horizon (360m gives ~7 seconds advance notice at 180 km/h without sign overlap)
      const ALERT_HORIZON = 360;
      const NEAR_ZONE_DIST = 220; // Continuously visible when approaching turnout exit zone (220m)
      const ADVANCE_DURATION = 10000; // Auto-dismiss advance banner after 10 seconds when far out

      const rInfo = splineRoad.getRoadInfo ? splineRoad.getRoadInfo(pX, pZ) : null;
      const isOnTrail = Boolean(gameState.isOnTrail || (rInfo && rInfo.isOnTrail));

      if (rInfo && rInfo.isTurnout && rInfo.turnoutData) {
        closestLot = rInfo.turnoutData;
        closestDist = 0;
        isInCurrentLot = true;
      } else if (!isInCurrentLot && !isOnTrail) {
        for (let i = 0; i < SCENIC_PARKING_LOTS.length; i++) {
          const lot = SCENIC_PARKING_LOTS[i];
          const dz = lot.z - pZ;
          if (dz >= -25 && dz <= ALERT_HORIZON) {
            const dist = Math.abs(dz);
            if (dist < closestDist) {
              closestDist = dist;
              closestLot = lot;
            }
          }
        }
      }

      const isNewLot = closestLot && (this._lastAlertedLotId !== closestLot.id);
      if (isNewLot) {
        this._lastAlertedLotId = closestLot.id;
        this._scenicAlertStartTime = now;
        this._scenicDismissedByUser = false;
        this._lastNearZoneTriggered = false;
      }

      const isNearZone = isInCurrentLot || (closestDist <= NEAR_ZONE_DIST);
      if (isNearZone && !this._lastNearZoneTriggered) {
        this._lastNearZoneTriggered = true;
        this._scenicDismissedByUser = false; // Reset dismissal on arriving near the zone
      }

      const isWithinAdvanceWindow = Boolean(this._scenicAlertStartTime && (now - this._scenicAlertStartTime <= ADVANCE_DURATION));
      const shouldShow = Boolean(
        closestLot &&
        !isOnTrail &&
        !this._scenicDismissedByUser &&
        (isNearZone || isWithinAdvanceWindow)
      );

      if (shouldShow) {
        this._currentApproachingLot = closestLot;
        this._isInCurrentLot = isInCurrentLot;
        this.scenicWaypoint.classList.add('visible');

        if (isInCurrentLot) {
          this.scenicWaypoint.classList.add('in-lot');
        } else {
          this.scenicWaypoint.classList.remove('in-lot');
        }

        // Trigger Audio Chime & Attention Pop with 8-second throttle to prevent rapid-fire chime overlap
        if (this._lastAnimatedLotId !== closestLot.id && !isInCurrentLot) {
          this._lastAnimatedLotId = closestLot.id;
          this.scenicWaypoint.classList.remove('pop-alert');
          void this.scenicWaypoint.offsetWidth; // Reflow to re-trigger CSS pulse
          this.scenicWaypoint.classList.add('pop-alert');

          if (!this._lastScenicChimeTime || (now - this._lastScenicChimeTime > 8000)) {
            this._lastScenicChimeTime = now;
            if (this.soundEngine && this.soundEngine.playScenicDiscoveryChime) {
              this.soundEngine.playScenicDiscoveryChime();
            }
          }
        }

        if (this.scenicLotName && this.scenicLotName.textContent !== closestLot.name) {
          this.scenicLotName.textContent = closestLot.name;
        }
        if (this.scenicLotSub && closestLot.sub && this.scenicLotSub.textContent !== closestLot.sub) {
          this.scenicLotSub.textContent = closestLot.sub;
        }

        const isRight = closestLot.side === 'right';
        if (this.scenicExitSide) {
          const exitText = isInCurrentLot 
            ? 'PULLED IN' 
            : (closestLot.customExitText ? closestLot.customExitText : (isRight ? 'EXIT RIGHT ↗' : 'EXIT LEFT ↖'));
          const exitBg = isInCurrentLot 
            ? '#38bdf8' 
            : (closestLot.customExitColor ? closestLot.customExitColor : (isRight ? '#f59e0b' : '#0ea5e9'));
          if (this.scenicExitSide.textContent !== exitText) {
            this.scenicExitSide.textContent = exitText;
            this.scenicExitSide.style.background = exitBg;
          }
        }

        if (this.scenicLotDist) {
          this.scenicLotDist.textContent = isInCurrentLot ? 'PHOTO' : `${Math.round(closestDist)}`;
        }
        if (this.scenicLotUnit) {
          this.scenicLotUnit.textContent = isInCurrentLot ? 'SPOT' : 'm';
        }

        if (this.scenicActionHint) {
          const isTouch = document.body.classList.contains('has-touch-controls') || ('ontouchstart' in window);
          let hintText = '';
          let hintColor = '#94a3b8';
          if (isInCurrentLot) {
            hintText = isTouch ? '★ TAP TO READ HISTORY' : '★ PRESS [E] TO READ HISTORY';
            hintColor = '#38bdf8';
          } else if (closestDist < 90) {
            hintText = 'BRAKE NOW • TURN IN';
            hintColor = '#facc15';
          } else if (closestDist <= 220) {
            hintText = 'SLOW DOWN • PREPARE TO EXIT';
            hintColor = '#38bdf8';
          } else {
            hintText = 'SCENIC OVERLOOK AHEAD • CRUISE & OBSERVE';
            hintColor = '#94a3b8';
          }
          if (this.scenicActionHint.textContent !== hintText) {
            this.scenicActionHint.textContent = hintText;
            this.scenicActionHint.style.color = hintColor;
          }
        }

        if (this.scenicProgressBar) {
          const pct = isInCurrentLot ? 100 : Math.max(0, Math.min(100, Math.round(((ALERT_HORIZON - closestDist) / ALERT_HORIZON) * 100)));
          this.scenicProgressBar.style.width = `${pct}%`;
        }
      } else {
        this._currentApproachingLot = null;
        this._isInCurrentLot = false;
        this.scenicWaypoint.classList.remove('visible');
        this.scenicWaypoint.classList.remove('in-lot');
        this.scenicWaypoint.classList.remove('pop-alert');
      }
    }

    // Historical Plaque Prompt
    if (this.historyPromptPill) {
      const plaque = gameState.nearbyHistoryPlaque;
      const reading = gameState.isReadingHistory;
      if (reading || !plaque) {
        this.historyPromptPill.classList.remove('visible');
      } else {
        this.historyPromptPill.classList.add('visible');
        if (this.historyPromptName && this.historyPromptName.textContent !== plaque.name) {
          this.historyPromptName.textContent = plaque.name;
        }
      }
    }

    // Binocular Prompt Pill & Telemetry
    if (this.binocularPromptPill) {
      const vf = gameState.nearbyViewfinder;
      const inBino = gameState.isBinocularView;
      if (inBino || !vf) {
        this.binocularPromptPill.classList.remove('visible');
      } else {
        this.binocularPromptPill.classList.add('visible');
        if (this.binocularPromptName && this.binocularPromptName.textContent !== vf.name) {
          this.binocularPromptName.textContent = vf.name;
        }
      }
    }

    if (gameState.isBinocularView) {
      if (this.binocularHeadingVal) {
        const deg = gameState.binocularAzimuthDeg || 0;
        let card = 'N';
        if (deg >= 23 && deg < 68) card = 'NE';
        else if (deg >= 68 && deg < 113) card = 'E';
        else if (deg >= 113 && deg < 158) card = 'SE';
        else if (deg >= 158 && deg < 203) card = 'S';
        else if (deg >= 203 && deg < 248) card = 'SW';
        else if (deg >= 248 && deg < 293) card = 'W';
        else if (deg >= 293 && deg < 338) card = 'NW';
        this.binocularHeadingVal.textContent = `${String(deg).padStart(3, '0')}° ${card}`;
      }
      if (this.binocularTargetVal) {
        if (gameState.surveillanceLockProgress > 0 && gameState.mysteryMission && gameState.mysteryMission.state === 'unstarted') {
          const pct = Math.round(gameState.surveillanceLockProgress * 100);
          this.binocularTargetVal.innerHTML = `<span style="color: #ef4444; font-weight: 900;">🔴 RECORDING SURVEILLANCE [${pct}%]</span> • ${gameState.binocularTargetName || ''}`;
        } else if (gameState.binocularTargetName) {
          this.binocularTargetVal.textContent = gameState.binocularTargetName;
        }
      }
      if (this.binocularZoomIndicator) {
        const zoom = (48.0 / Math.max(6.0, gameState.binocularFov || 24.0)).toFixed(1);
        this.binocularZoomIndicator.textContent = `${zoom}x`;
      }
    }

    // Drift Combo Badge
    const driftChain = Math.round(gameState.currentDriftChain || 0);
    if (driftChain > 20) {
      if (driftChain !== this._cacheDrift) {
        this._cacheDrift = driftChain;
        if (this.driftVal) this.driftVal.textContent = `+${driftChain} x${(gameState.driftMultiplier || 1.0).toFixed(1)}`;
      }
      if (this.driftBadge) this.driftBadge.classList.add('show');
    } else {
      this._cacheDrift = 0;
      if (this.driftBadge) this.driftBadge.classList.remove('show');
    }

    // Rollover Alert
    if (this.flipAlert && gameState.isFlipped !== this._cacheFlipped) {
      this._cacheFlipped = gameState.isFlipped;
      if (gameState.isFlipped) this.flipAlert.classList.add('show');
      else this.flipAlert.classList.remove('show');
    }

    // Out-of-Bounds Rescue Alert (Only show when way out of bounds, NOT when stuck)
    if (this.stuckAlert && (gameState.isOutOfBounds !== this._cacheOutOfBounds || gameState.isFlipped !== this._cacheFlipped)) {
      this._cacheOutOfBounds = gameState.isOutOfBounds;
      if (gameState.isOutOfBounds && !gameState.isFlipped) this.stuckAlert.classList.add('show');
      else this.stuckAlert.classList.remove('show');
    }

    // 🎬 Cinematic Cutscene Overlay & Subtitles
    const isCutscene = Boolean(gameState.isCutsceneActive);
    if (this.cutsceneOverlay) {
      if (isCutscene !== this._cacheCutsceneActive) {
        this._cacheCutsceneActive = isCutscene;
        this.cutsceneOverlay.classList.toggle('active', isCutscene);
        this.container.classList.toggle('in-cutscene', isCutscene);
        if (typeof document !== 'undefined' && document.body) {
          document.body.classList.toggle('in-cutscene', isCutscene);
        }
      }
      if (isCutscene) {
        if (this.cutsceneSubtitlesText) {
          const subs = gameState.cutsceneSubtitles || '';
          if (this._cacheSubtitles !== subs) {
            this._cacheSubtitles = subs;
            if (!subs) {
              this.cutsceneSubtitlesText.textContent = '';
            } else if (subs.startsWith('★') || subs.startsWith('[')) {
              this.cutsceneSubtitlesText.innerHTML = `<span style="color: #facc15; font-weight: 800; letter-spacing: 0.8px;">${subs}</span>`;
            } else if (subs.includes(':')) {
              const colonIdx = subs.indexOf(':');
              const speaker = subs.substring(0, colonIdx);
              const rest = subs.substring(colonIdx + 1);
              this.cutsceneSubtitlesText.innerHTML = `<span style="color: #facc15; font-weight: 800; letter-spacing: 0.6px;">${speaker}:</span><span style="color: #ffffff; font-weight: 600;">${rest}</span>`;
            } else {
              this.cutsceneSubtitlesText.innerHTML = `<span style="color: #fef08a; font-style: italic;">${subs}</span>`;
            }
          }
        }
        if (this.cutsceneTitleText) {
          const title = gameState.cutsceneTitleCard
            ? gameState.cutsceneTitleCard
            : (gameState.cutsceneName === 'police_turnin'
                ? '★ LAW ENFORCEMENT EVIDENCE TURN-IN ★'
                : '★ SURVEILLANCE DOSSIER: ARROWHEAD CANYON ★');
          if (this._cacheCutsceneTitle !== title) {
            this._cacheCutsceneTitle = title;
            this.cutsceneTitleText.textContent = title;
          }
        }
      }
    }

    // Live update tablet when open
    if (gameState.isTabletOpen) {
      this.updateTabletLiveTelemetry(physics, splineRoad);
    }
  }
}
