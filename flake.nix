{
  description = "zmk-studio development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            cargo
            rustc
            clippy
            rustfmt
            pkg-config
            openssl
          ];

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
            pkgs.openssl
            pkgs.stdenv.cc.cc.lib
          ];

          shellHook = ''
            echo "zmk-studio dev shell"
            echo "  node $(node --version)"
            echo "  npm  $(npm --version)"
            echo "  cargo $(cargo --version)"
            echo ""
            echo "  npm install          install dependencies"
            echo "  npm run storybook    start storybook on :6006"
            echo "  npm run dev          start vite dev server"
            echo "  npm run lint         run eslint"
            echo "  npm run tauri        tauri CLI"
          '';
        };
      });
}
