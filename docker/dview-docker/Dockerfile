FROM dview/superset:5.0.10

USER root

RUN apt-get update && \
    apt-get install -y awscli libaio1 wget zip  && \
    apt-get install --no-install-recommends -y firefox-esr && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV GECKODRIVER_VERSION=0.36.0
RUN wget -q https://github.com/mozilla/geckodriver/releases/download/v${GECKODRIVER_VERSION}/geckodriver-v${GECKODRIVER_VERSION}-linux64.tar.gz && \
    tar -x geckodriver -zf geckodriver-v${GECKODRIVER_VERSION}-linux64.tar.gz -O > /usr/bin/geckodriver && \
    chmod 755 /usr/bin/geckodriver && \
    rm geckodriver-v${GECKODRIVER_VERSION}-linux64.tar.gz

USER superset