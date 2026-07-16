{
  description = "zmk-studio devshell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
            rustc
            cargo
            rustfmt
            clippy
            pkg-config
            openssl
            udev
          ] ++ pkgs.lib.optionals pkgs.stdenv.isLinux [
            glib
            gtk3
            webkitgtk_4_1
            libsoup_3
            cairo
            pango
            gdk-pixbuf
            atk
            harfbuzz
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
            darwin.apple_sdk.frameworks.WebKit
            darwin.apple_sdk.frameworks.Cocoa
            darwin.apple_sdk.frameworks.AppKit
            darwin.apple_sdk.frameworks.Security
            darwin.apple_sdk.frameworks.SystemConfiguration
          ];

          shellHook = ''
            export PATH=$(echo "$PATH" | tr ':' '\n' | grep -v "$HOME/.cargo/bin" | paste -sd ':')

            export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig:${pkgs.udev.dev}/lib/pkgconfig:${pkgs.dbus.dev}/lib/pkgconfig:$PKG_CONFIG_PATH"
            echo "devshell loaded"
            node -v
            npm -v
          '';
        };
      });
}

