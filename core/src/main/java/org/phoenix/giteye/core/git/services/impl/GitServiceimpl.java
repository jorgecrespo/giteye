package org.phoenix.giteye.core.git.services.impl;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ListBranchCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.NoHeadException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.diff.RawTextComparator;
import org.eclipse.jgit.lib.*;
import org.eclipse.jgit.revplot.PlotCommit;
import org.eclipse.jgit.revplot.PlotCommitList;
import org.eclipse.jgit.revplot.PlotLane;
import org.eclipse.jgit.revplot.PlotWalk;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevSort;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.phoenix.giteye.core.beans.BranchBean;
import org.phoenix.giteye.core.beans.CommitBean;
import org.phoenix.giteye.core.beans.RepositoryBean;
import org.phoenix.giteye.core.exceptions.json.NotInitializedRepositoryException;
import org.phoenix.giteye.core.git.services.GitService;
import org.phoenix.giteye.core.graph.LogGraphProcessorFactory;
import org.phoenix.giteye.json.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: phoenix
 * Date: 2/27/13
 * Time: 11:32 PM
 * To change this template use File | Settings | File Templates.
 */
@Service
public class GitServiceimpl implements GitService {
    private final static Logger logger = LoggerFactory.getLogger(GitServiceimpl.class);
    @Override
    public List<CommitBean> getLog(RepositoryBean repository) {
        FileRepositoryBuilder builder = new FileRepositoryBuilder();
        Repository repo = null;
        List<CommitBean> commits = new ArrayList<CommitBean>();
        try {
            repo = builder.setGitDir(new File(repository.getPath()))
                    .readEnvironment() // scan environment GIT_* variables
                    .findGitDir() // scan up the file system tree
                    .build();

            Git git = new Git(repo);
            Iterable<RevCommit> iterable = git.log().call();
            for (RevCommit revCommit : iterable) {
                CommitBean commit = new CommitBean();
                for (RevCommit parent : revCommit.getParents()) {
                    for (CommitBean candidate : commits) {
                        if (candidate.getId().equals(parent.getId().name())) {
                            commit.addParent(candidate);
                        }
                    }
                }

                commit.setDate(new Date(revCommit.getCommitTime() * 1000L));
                commit.setId(revCommit.getId().name());
                commit.setCommitterName(revCommit.getAuthorIdent().getName());
                commit.setMessage(revCommit.getShortMessage());
                commits.add(commit);
            }
        } catch (IOException e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        } catch (NoHeadException e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        } catch (GitAPIException e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        }
        return commits;
    }

    @Override
    public List<BranchBean> getBranches(RepositoryBean repository) {
        FileRepositoryBuilder builder = new FileRepositoryBuilder();
        Repository repo = null;
        List<BranchBean> branches= new ArrayList<BranchBean>();
        try {
            repo = builder.setGitDir(new File(repository.getPath()))
                    .readEnvironment() // scan environment GIT_* variables
                    .findGitDir() // scan up the file system tree
                    .build();

            Git git = new Git(repo);
            Iterable<Ref> iterable = git.branchList().setListMode(ListBranchCommand.ListMode.ALL).call();
            for (Ref ref : iterable) {
                BranchBean branch = new BranchBean();
                String name = ref.getName();
                if (name.startsWith("refs/heads/")) {
                    name = name.replace("refs/heads/","");
                    branch.setName(name);
                    branch.setRemote(false);
                } else {
                    name = name.replace("refs/","");
                    branch.setName(name);
                    branch.setRemote(true);
                }
                branches.add(branch);
            }
        } catch (IOException e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        } catch (NoHeadException e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        } catch (GitAPIException e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        }
        return branches;
    }

    @Override
    public JsonCommitDetails getCommitDetails(RepositoryBean repository, String commitId) {
        FileRepositoryBuilder builder = new FileRepositoryBuilder();
        Repository repo = null;

        JsonCommitDetails details = new JsonCommitDetails();
        try {
            repo = builder.setGitDir(new File(repository.getPath()))
                    .readEnvironment() // scan environment GIT_* variables
                    .findGitDir() // scan up the file system tree
                    .build();

            RevWalk revWalk = new RevWalk(repo);

            RevCommit commit = revWalk.parseCommit(repo.resolve(commitId));
            RevCommit parent = null;
            if (commit == null) {
                return null;
            }
            if (commit.getParentCount() == 0) {
                return null;
            }

            List<JsonDiff> differences = new ArrayList<JsonDiff>();
            for (int i=0; i<commit.getParentCount(); i++) {
                parent = revWalk.parseCommit(commit.getParent(i).getId());
                JsonDiffs diffSet = new JsonDiffs();
                diffSet.setParentCommitId(parent.getId().name());
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                DiffFormatter df = new DiffFormatter(out);
                df.setRepository(repo);
                df.setDiffComparator(RawTextComparator.DEFAULT);
                df.setDetectRenames(true);

                details.setId(commit.getId().name());
                details.setMessage(commit.getFullMessage());
                details.setCommitDate(new Date(commit.getCommitTime() * 1000L));
                details.setAuthorName(commit.getAuthorIdent().getName());
                details.setAuthorEmail(commit.getAuthorIdent().getEmailAddress());

                List<DiffEntry> diffs = df.scan(parent.getTree(), commit.getTree());
                for (DiffEntry diff : diffs) {
                    df.format(diff);
                    JsonDiff jdiff = new JsonDiff();
                    jdiff.setChangeName(diff.getChangeType().name());
                    jdiff.setNewMode(diff.getNewMode().getBits());
                    jdiff.setNewPath(diff.getNewPath());
                    jdiff.setOldMode(diff.getOldMode().getBits());
                    jdiff.setOldPath(diff.getOldPath());
                    //jdiff.setDiff();
                    String lines = out.toString("UTF-8");
                    StringTokenizer tokenizer = new StringTokenizer(lines,"\n");
                    JsonDiffHunk hunk = null;
                    int oldLineNumber = 0;
                    int newLineNumber = 0;
                    while (tokenizer.hasMoreTokens()) {
                        String line = tokenizer.nextToken();
                        if (line.startsWith("@@")) {
                            if (hunk != null) {
                                jdiff.addHunk(hunk);
                            }
                            hunk = new JsonDiffHunk();
                            line = line.replace("@@","").trim();
                            StringTokenizer spaceTokenizer = new StringTokenizer(line, " ");
                            while (spaceTokenizer.hasMoreTokens()) {
                                String token = spaceTokenizer.nextToken();
                                if (token.startsWith("-")) {
                                    token = token.substring(1);
                                    // old file diff part
                                    String[] elements = token.trim().split(",");
                                    hunk.setOldLineStart(Integer.parseInt(elements[0]));
                                    hunk.setOldLineRange(Integer.parseInt(elements[1]));
                                    oldLineNumber = hunk.getOldLineStart()-1;
                                } else {
                                    // new file diff part
                                    token = token.substring(1);
                                    String[] elements = token.trim().split(",");
                                    hunk.setNewLineStart(Integer.parseInt(elements[0]));
                                    hunk.setNewLineRange(Integer.parseInt(elements[1]));
                                    newLineNumber = hunk.getNewLineStart()-1;
                                }
                            }
                        } else if (hunk != null) {
                            JsonHunkLine hunkLine = new JsonHunkLine();
                            if (line.startsWith("-")) {
                                oldLineNumber++;
                                hunkLine.setOldLineNumber(oldLineNumber);
                                hunkLine.setNewLineNumber(0);
                                if (line.length() == 1) {
                                    line = " ";
                                } else {
                                    line = " "+line.substring(1);
                                }
                                hunkLine.setType(HunkLineType.OLD);
                            } else if (line.startsWith("+")) {
                                newLineNumber++;
                                hunkLine.setNewLineNumber(newLineNumber);
                                hunkLine.setOldLineNumber(0);
                                if (line.length() == 1) {
                                    line = " ";
                                } else {
                                    line = " "+line.substring(1);
                                }
                                hunkLine.setType(HunkLineType.NEW);
                            } else {
                                newLineNumber++;
                                oldLineNumber++;
                                hunkLine.setOldLineNumber(oldLineNumber);
                                hunkLine.setNewLineNumber(newLineNumber);
                                hunkLine.setType(HunkLineType.COMMON);
                            }
                            hunkLine.setLine(line);
                            hunk.addLine(hunkLine);
                        }
                    }
                    if (hunk != null) {
                        jdiff.addHunk(hunk);
                    }
                    out.reset();
                    diffSet.addDifference(jdiff);
                }
                details.addDifferences(diffSet);
            }
        } catch (IOException ioe) {

        }
        return details;
    }

    @Override
    public JsonRepository getLogAsJson(RepositoryBean repository) throws NotInitializedRepositoryException {
        FileRepositoryBuilder builder = new FileRepositoryBuilder();
        Repository repo = null;
        int position = 0;
        try {
            repo = builder.setGitDir(new File(repository.getPath()))
                    .readEnvironment()
                    .findGitDir().build();

            JsonRepository jrep = new JsonRepository(repository.getDisplayName());
            // Retrieve refs
            RefDatabase refDb = repo.getRefDatabase();
            Map<String, Ref> refs = refDb.getRefs("");
            for (Map.Entry<String, Ref> refEntry : refs.entrySet()) {
                String refName = refEntry.getKey();
                Ref ref = refEntry.getValue();
                String name = refName;
                if (name.contains("/") && !name.contains("remotes") && !name.contains("tags")) {
                    name = name.substring(name.lastIndexOf("/")+1);
                } else if (name.contains("tags")) {
                    name = name.substring(name.lastIndexOf("/")+1);
                    JsonTag tag = new JsonTag();
                    tag.setName(name);
                    tag.setTarget(ref.getTarget().getObjectId().name());
                    tag.setRef(ref.getObjectId().name());
                    jrep.addTag(tag);
                    continue;
                } else if (name.contains("/")) {
                    name = name.replace("refs/", "");
                    name = name.replace("remotes/", "");
                }
                JsonBranch branch = new JsonBranch(name);
                branch.setRef(ref.getName());
                branch.setTarget(ref.getObjectId().name());
                if (repository.getBranch().equals(name)) {
                    branch.setCurrent(true);
                }
                if (ref instanceof SymbolicRef) {
                    branch.setSymbolic(true);
                }
                jrep.addBranch(branch);
            }
            // Retrieve objects
            PlotWalk revWalk = new PlotWalk(repo);
            // First create a list of heads targets for all non symbolic refs
            List<RevCommit> heads = new ArrayList<RevCommit>();
            for (JsonBranch branch : jrep.getBranches()) {
                if (branch.isSymbolic()) {
                    continue;
                }
                String headId = branch.getTarget();
                RevCommit head = revWalk.lookupCommit(repo.resolve(headId));
                if (head == null) {
                    continue;
                }
                heads.add(head);
            }
            //revWalk.sort(RevSort.REVERSE);
            revWalk.markStart(heads);
            PlotCommitList<PlotLane> commits = new PlotCommitList<PlotLane>();
            commits.source(revWalk);
            commits.fillTo(Integer.MAX_VALUE);
            Iterator<PlotCommit<PlotLane>> iterator = commits.iterator();
            while (iterator.hasNext()) {
                PlotCommit revc = iterator.next();
                JsonCommit commit = new JsonCommit(revc.getId().name());
                commit.setShortMessage(revc.getShortMessage());
                commit.setMessage(revc.getFullMessage());
                commit.setDate(new Date(revc.getCommitTime() * 1000L));
                commit.setAuthorName(revc.getAuthorIdent().getName());
                commit.setAuthorEmail(revc.getAuthorIdent().getEmailAddress());
                commit.setCommitterName(revc.getCommitterIdent().getName());
                commit.setCommitterEmail(revc.getCommitterIdent().getEmailAddress());
                commit.setPosition(position);
                if (revc.getLane() == null) {
                    commit.setLane(0);
                } else {
                    commit.setLane(revc.getLane().getPosition());
                }
                position++;
                jrep.addCommit(commit);
                if (revc.getParents() == null || revc.getParents().length == 0) {
                    continue;
                }
                for (RevCommit parent : revc.getParents()) {
                    commit.addParent(parent.getId().name());
                }

            }
            // set children
            for (JsonCommit commit : jrep.getCommits()) {
                if (!CollectionUtils.isEmpty(commit.getParents())) {
                    for (String parent : commit.getParents()) {
                        JsonCommit parentCommit = jrep.getCommit(parent);
                        if (parentCommit == null) {
                            logger.error("Could not get JsonCommit with id "+parent);
                        } else {
                            JsonCommitChild child = new JsonCommitChild(commit.getId());
                            child.setLane(commit.getLane());
                            child.setPosition(commit.getPosition());
                            parentCommit.addChild(child);

                        }
                    }
                }
                commit.resetParents();
            }
            revWalk.release();
            //return LogGraphProcessorFactory.getProcessor().process(jrep);
            return jrep;

        } catch (IOException e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        }
        return null;

    }
}
