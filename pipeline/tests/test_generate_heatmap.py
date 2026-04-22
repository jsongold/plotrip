"""Unit tests for generate_heatmap (offline, no network access)."""

import numpy as np
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from generate_heatmap import temp_to_rgba, TEMP_MIN, TEMP_MAX


class TestTempToRgba:
    def test_cold_is_blue(self):
        data = np.array([[-20.0]])
        rgba = temp_to_rgba(data)
        r, g, b, a = rgba[0, 0]
        assert b > r, f"At -20C blue({b}) should dominate red({r})"
        assert a == 140

    def test_hot_is_red(self):
        data = np.array([[40.0]])
        rgba = temp_to_rgba(data)
        r, g, b, a = rgba[0, 0]
        assert r > b, f"At 40C red({r}) should dominate blue({b})"

    def test_mid_is_greenish(self):
        data = np.array([[10.0]])
        rgba = temp_to_rgba(data)
        r, g, b, a = rgba[0, 0]
        assert g > r and g > b, f"At 10C green({g}) should dominate r({r}) b({b})"

    def test_nan_is_transparent(self):
        data = np.array([[np.nan]])
        rgba = temp_to_rgba(data)
        assert rgba[0, 0, 3] == 0

    def test_clamp_below_min(self):
        data = np.array([[-50.0]])
        rgba_below = temp_to_rgba(data)
        rgba_min = temp_to_rgba(np.array([[TEMP_MIN]]))
        np.testing.assert_array_equal(rgba_below, rgba_min)

    def test_clamp_above_max(self):
        data = np.array([[60.0]])
        rgba_above = temp_to_rgba(data)
        rgba_max = temp_to_rgba(np.array([[TEMP_MAX]]))
        np.testing.assert_array_equal(rgba_above, rgba_max)

    def test_output_shape(self):
        data = np.random.uniform(-20, 40, (36, 72))
        rgba = temp_to_rgba(data)
        assert rgba.shape == (36, 72, 4)
        assert rgba.dtype == np.uint8

    def test_custom_alpha(self):
        data = np.array([[10.0]])
        rgba = temp_to_rgba(data, alpha=200)
        assert rgba[0, 0, 3] == 200

    def test_coldest_bluest_hottest_reddest(self):
        temps = np.array([[t] for t in np.linspace(-20, 40, 20)])
        rgba = temp_to_rgba(temps)
        coldest = rgba[0, 0]
        hottest = rgba[-1, 0]
        assert coldest[2] > coldest[0], "Coldest should be more blue than red"
        assert hottest[0] > hottest[2], "Hottest should be more red than blue"
