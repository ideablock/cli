![](https://ideablock.io/IBCLI.png)

Command-line version of [IdeaBlock Beta](https://ideablock.io) for git-like idea push in workflows.

# Prerequisites
- [Register](https://beta.ideablock.io) for a free IdeaBlock Beta account ₁
- Install [NodeJS and npm](https://nodejs.org/en/download/)

# Download
Install ideablock-cli globally using npm:
```bash
$ npm i -g ideablock-cli
```

# Usage
IdeaBlock CLI bundles the current version of all files in the current working directory and assumes that the directory is flat (in other words, files in subdirectories are not included in the idea upload).

```bash
$ cd /path/to/dir/with/idea/files/
$ ideablock init
```

The current version v1.0.1 requires a flat file structure for the idea.  In other words, any subdirectories and subdirectory files under the directory from which `ideablock init` is called will be ignored.

# Beta
**Please be aware that this is beta software. Accordingly, the software will be frequently updated with bug fixes, sometimes without prior announcement.**

**Though the hashes generated by the software will be included in the Bitcoin and Litecoin Mainnets, the user must keep a copy of all zipped Idea Files in a safe place for subsequent proof of existence.**

₁ Please be sure to read and agree to IdeaBlock Beta [Terms and Conditions](https://beta.ideablock.io/terms)